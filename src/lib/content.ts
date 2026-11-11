import { createHash } from 'node:crypto';
import { parseFrontmatter } from 'astro/markdown';
import { parse } from 'yaml';
import blogAuthors from '../../content/blog/.authors.yml?raw';
import blogDefaults from '../../content/blog/posts/.meta.yml?raw';
import nowSettings from '../../content/now/.meta.yml?raw';
import baseline from '../../content/imported/source-hashes.json';

const sources = import.meta.glob(['../../content/**/*.md', '!../../content/drafts/**/*.md'], { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const settings: Record<string, string> = {
  '../../content/blog/.authors.yml': blogAuthors,
  '../../content/blog/posts/.meta.yml': blogDefaults,
  '../../content/now/.meta.yml': nowSettings,
};

export const base = import.meta.env.BASE_URL;
export const href = (route: string) => base + route;

type Frontmatter = {
  title?: string; description?: string; date?: string | Date; slug?: string;
  draft?: boolean; image?: string; image_alt?: string; image_layout?: 'top' | 'side';
  categories?: string[]; authors?: string[]; readtime?: number; hide?: string[];
  projects?: Project[];
};
export type Project = { id: string; name: string; url: string; description: string; status?: string };
export type Entry = { file: string; route: string; title: string; body: string; meta: Frontmatter; date: string; changed: boolean; kind: 'page' | 'post' | 'update' };
type Author = { name: string; description?: string; url?: string };

const components = import.meta.glob('../components/*.astro', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;

const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const original = baseline as Record<string, string>;
export const setting = <T>(file: string, fallback: T): T => {
  const text = settings[`../../content/${file}`];
  return text ? parse(text) as T : fallback;
};

function dateString(date: string | Date | undefined, file: string) {
  const value = date instanceof Date ? date.toISOString().slice(0, 10) : String(date ?? '');
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value);
  if (!match) throw new Error(`需要 YYYY-MM-DD 日期：${file}`);
  return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
}

function makeEntry(file: string, text: string): Entry | undefined {
  const { frontmatter, content } = parseFrontmatter(text);
  const meta = frontmatter as Frontmatter;
  if (meta.draft) return;
  const name = file.split('/').at(-1)!.replace(/\.md$/, '');
  const kind = file.startsWith('blog/posts/') ? 'post' : file.startsWith('now/') && file !== 'now/index.md' ? 'update' : 'page';
  const date = kind === 'post' ? dateString(meta.date, file) : kind === 'update' ? dateString(name, file) : '';
  const title = meta.title || /^#\s+(.+)$/m.exec(content)?.[1]?.trim() || name;
  const slug = String(meta.slug || name).trim();
  if (kind === 'post' && !/^[\p{L}\p{N}][\p{L}\p{N}._-]*$/u.test(slug)) {
    throw new Error(`博客 slug 只允许字母、数字、点、下划线和连字符：${file}`);
  }
  const route = kind === 'post'
    ? `blog/${date.replaceAll('-', '/')}/${slug}/`
    : file === '404.md' ? '404.html' : file.replace(/(?:^|\/)index\.md$/, '/').replace(/^\//, '').replace(/\.md$/, '/');
  return { file, route, title, body: content, meta, date, changed: hash(text) !== original[file], kind };
}

export const entries = Object.entries(sources).flatMap(([path, text]) => {
  const entry = makeEntry(path.slice('../../content/'.length), text);
  return entry ? [entry] : [];
});
export const entriesByRoute = new Map(entries.map((entry) => [entry.route, entry]));
if (entries.length !== entriesByRoute.size) throw new Error('Markdown 中存在重复的网址。');
export const entriesByFile = new Map(entries.map((entry) => [entry.file, entry]));
const newestFirst = (left: Entry, right: Entry) => right.date.localeCompare(left.date) || left.route.localeCompare(right.route);
export const posts = entries.filter(({ kind }) => kind === 'post').sort(newestFirst);
export const updates = entries.filter(({ kind }) => kind === 'update').sort(newestFirst);
if (new Set(updates.map(({ date }) => date)).size !== updates.length) throw new Error('Now 近况日期重复。');
export const archiveMonths = Array.from(new Set(posts.map(({ date }) => date.slice(0, 7))));
export const archiveRoute = (month: string) => `blog/archive/${month.replace('-', '/')}/`;
export const tags = Array.from(new Set(posts.flatMap(({ meta }) => meta.categories ?? []))).map((value) => value.trim()).filter(Boolean);
export const postTags = (entry: Entry) => (entry.meta.categories ?? []).map((value) => value.trim()).filter(Boolean);

function groupChanged(prefix: string) {
  const group = Object.entries({ ...sources, ...settings }).filter(([file]) =>
    file.startsWith(`../../content/${prefix}/`) && (file in settings || entriesByFile.has(file.slice('../../content/'.length))),
  );
  return group.some(([file, value]) => hash(value) !== original[file.slice('../../content/'.length)]) ||
    Object.keys(original).some((file) => file.startsWith(prefix + '/') && !file.endsWith('/.nav.yml') && !(`../../content/${file}` in sources || `../../content/${file}` in settings));
}
export const blogChanged = groupChanged('blog');
export const nowChanged = groupChanged('now');
export const authors = setting<{ authors: Record<string, Author> }>('blog/.authors.yml', { authors: {} }).authors;
export const defaultAuthors = setting<{ authors: string[] }>('blog/posts/.meta.yml', { authors: [] }).authors;
export const nowIntro = setting('now/.meta.yml', { intro: '' }).intro;

export function sourceChanged(route: string) {
  return (route.startsWith('blog/') && blogChanged) || (route.startsWith('now/') && nowChanged) || Boolean(entriesByRoute.get(route)?.changed);
}

export function templateChanged(route: string) {
  const names = ['MarkdownPage.astro'];
  if (route.startsWith('blog/')) names.push('BlogList.astro', 'BlogPost.astro', 'PostMeta.astro');
  if (route.startsWith('now/')) names.push('NowPage.astro');
  if (route === 'projects/') names.push('ProjectCard.astro');
  return names.some((name) => hash(components['../components/' + name]) !== original['component:' + name]);
}

export const dynamicRoutes = [
  ...entries.map(({ route }) => route),
  ...archiveMonths.map(archiveRoute),
  ...Array.from({ length: Math.max(0, Math.ceil(posts.length / 8) - 1) }, (_, i) => `blog/page/${i + 2}/`),
];

export function readingStats(post: Entry) {
  const clean = post.body.replace(/<!--.*?-->|https?:\/\/\S+/gs, '');
  const words = (clean.match(/[\p{Script=Han}]/gu)?.length ?? 0) + (clean.match(/[A-Za-z0-9]+/g)?.length ?? 0);
  return { words, readtime: post.meta.readtime ?? Math.max(1, Math.ceil(words / 400)) };
}
