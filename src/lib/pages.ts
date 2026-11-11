import routes from '../../content/imported/routes.json';
import { archiveMonths, archiveRoute, dynamicRoutes, entriesByRoute, href, posts, sourceChanged, templateChanged } from './content';
import type { Heading } from './markdown';

const fragments = import.meta.glob('../../content/imported/fragments/*.html', {
  eager: true, query: '?raw', import: 'default',
}) as Record<string, string>;
const articles = import.meta.glob('../../content/imported/pages/**/*.html', {
  eager: true, query: '?raw', import: 'default',
}) as Record<string, string>;

const originalRoutes = routes as Record<string, { head: string; prelude: string; sidebars: string; mainTail: string; afterMain: string }>;
export const routePaths = [...new Set([...dynamicRoutes, '404/'])];
export const originalArticle = (route: string) => {
  const file = route.endsWith('.html') ? route : `${route}index.html`;
  return articles[`../../content/imported/pages/${file}`] ?? '';
};
export const archivedMonth = (route: string) => archiveMonths.find((month) => archiveRoute(month) === route);
export const needsRender = (route: string) => !originalRoutes[route] || sourceChanged(route) || templateChanged(route);

const previousPost = Object.keys(routes).find((route) => /^blog\/\d{4}\/\d\d\/\d\d\//.test(route))!;
function templateRoute(route: string) {
  if (originalRoutes[route]) return route;
  if (route.startsWith('now/')) return 'now/';
  if (posts.some((post) => post.route === route)) return previousPost;
  if (route.startsWith('blog/')) return 'blog/';
  if (route.startsWith('about/')) return 'about/website/';
  return 'notes/overview/';
}

export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (character) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!,
);

function rebase(markup: string, origin: string) {
  const current = `https://kosmigen.github.io${href(origin)}`;
  const absolute = (value: string) => {
    if (/^(?:[a-z][\w+.-]*:|\/|#)/i.test(value)) return value;
    const url = new URL(value, current);
    return url.pathname + url.search + url.hash;
  };
  return markup
    .replace(/(href|src|data-site-root)="([^"]*)"/g, (_, attr, value) => `${attr}="${absolute(value)}"`)
    .replace(/(__md_scope=new URL\(")([^"]*)/g, (_, start, value) => start + absolute(value))
    .replace(/("(?:base|search)":\s*")([^"]*)/g, (_, start, value) => start + absolute(value));
}

function replaceToc(sidebars: string, headings: Heading[]) {
  const items = headings.filter((heading) => heading.depth > 1);
  const list = items.map(({ id, title }) => `<li class="md-nav__item"><a href="#${escapeHtml(id)}" class="md-nav__link"><span class="md-ellipsis">${escapeHtml(title)}</span></a></li>`).join('');
  const toc = `<nav class="md-nav md-nav--secondary" aria-label="On this page"><label class="md-nav__title" for="__toc"><span class="md-nav__icon md-icon"></span>On this page</label><ul class="md-nav__list" data-md-component="toc" data-md-scrollfix>${list}</ul></nav>`;
  return sidebars.replace(/<nav class="md-nav md-nav--secondary"[^>]*>[\s\S]*?<\/nav>(?=\s*<\/div>\s*<\/div>\s*<\/div>\s*$)/, toc);
}

export function getPage(route: string, headings?: Heading[]) {
  const origin = templateRoute(route);
  const entry = originalRoutes[origin];
  const fragment = (key: string | null) => {
    const markup = key ? fragments[`../../content/imported/fragments/${key}.html`] : '';
    return route === origin ? markup : rebase(markup, origin);
  };
  const source = entriesByRoute.get(route);
  let head = fragment(entry.head);
  let sidebars = fragment(entry.sidebars);
  let prelude = fragment(entry.prelude);
  if (needsRender(route)) {
    const title = source?.title || (archivedMonth(route) ?? (route.startsWith('blog/') ? 'Blog' : 'kosmigen'));
    if (source?.title || origin !== route) {
      head = head.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)} - kosmigen</title>`);
    }
    if (source?.meta.description) {
      head = head.replace(/(<meta name="description" content=")[^"]*"/, `$1${escapeHtml(source.meta.description)}"`);
    }
    head = head.replace(/(<link rel="canonical" href=")[^"]*"/, `$1https://kosmigen.github.io${href(route)}"`);
    if (headings?.length) {
      sidebars = replaceToc(sidebars, headings);
      prelude = prelude.replace(/(<a href=")#[^"]*(" class="md-skip")/, `$1#${escapeHtml(headings[0].id)}$2`);
    }
  }
  return { head, prelude, sidebars, mainTail: fragment(entry.mainTail), afterMain: fragment(entry.afterMain), article: originalArticle(route) };
}
