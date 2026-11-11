import { load } from 'cheerio';
import index from '../../../content/imported/search-index.json';
import { entries, nowChanged, postTags, updates } from '../../lib/content';
import { originalArticle, routePaths } from '../../lib/pages';
import { renderMarkdown } from '../../lib/markdown';

export async function GET() {
  const routes = new Set(routePaths);
  const changed = entries.filter(({ route, changed }) =>
    route !== '404.html' && (changed || !originalArticle(route) || (route === 'now/' && nowChanged)),
  );
  const changing = new Set(changed.map(({ route }) => route));
  const docs = index.docs.filter(({ location }) => {
    const route = location.split('#')[0];
    return routes.has(route) && !changing.has(route);
  });
  for (const entry of changed) {
    const source = entry.route === 'now/' ? updates[0] ?? entry : entry;
    const { html } = await renderMarkdown(source, source.body, originalArticle(entry.route));
    const $ = load(html, null, false);
    $('.headerlink,script,style').remove();
    const tags = postTags(entry);
    const metadata = tags.length ? { tags } : {};
    const sections = [{ location: entry.route, title: entry.title, text: '', ...metadata }];
    $.root().children().each((_, element) => {
      const node = $(element);
      const id = node.attr('id');
      const text = node.text().trim();
      if (/^h[1-6]$/.test(element.tagName) && id) {
        sections.push({ location: entry.route + '#' + encodeURIComponent(id), title: text, text: '', ...metadata });
      } else if (text) {
        sections.at(-1)!.text += ' ' + text;
      }
    });
    docs.push(...sections.map((section) => ({ ...section, text: section.text.trim() })));
  }
  return Response.json({ ...index, docs });
}
