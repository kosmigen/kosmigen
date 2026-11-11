import { satteri } from '@astrojs/markdown-satteri';
import { load } from 'cheerio';
import { posix } from 'node:path';
import { entriesByFile, href, type Entry } from './content';

export type Heading = { id: string; title: string; depth: number };
const renderer = satteri({ features: { smartPunctuation: false } }).createRenderer({
  syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
  shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' } },
});

function localUrl(value: string, file: string) {
  if (!value || /^(?:[a-z][\w+.-]*:|\/|#)/i.test(value)) return value;
  const [, raw, suffix] = /^([^?#]*)(.*)$/.exec(value)!;
  let target = raw;
  try { target = decodeURI(raw); } catch { /* Keep the literal path. */ }
  const resolved = posix.normalize(posix.join(posix.dirname(file), target));
  const entry = entriesByFile.get(resolved);
  if (entry) return href(entry.route) + suffix;
  if (resolved.startsWith('assets/')) return href(resolved) + suffix;
  return value;
}

export async function renderMarkdown(entry: Entry, body = entry.body, prior = '') {
  const { code } = await (await renderer).render(body);
  const $ = load(code, null, false);
  const previous = load(prior, null, false);
  const oldIds = new Map<string, string>();
  previous('h1[id],h2[id],h3[id],h4[id],h5[id],h6[id]').each((_, element) => {
    const clone = previous(element).clone();
    clone.find('.headerlink').remove();
    oldIds.set(clone.text().trim(), previous(element).attr('id')!);
  });
  const headings: Heading[] = [];
  const ids = new Set<string>();
  $('h1,h2,h3,h4,h5,h6').each((_, element) => {
    const heading = $(element);
    const title = heading.text().trim();
    const baseId = oldIds.get(title) || heading.attr('id') || 'section';
    let id = baseId;
    for (let suffix = 1; ids.has(id); suffix++) id = `${baseId}-${suffix}`;
    ids.add(id);
    heading.attr('id', id);
    if (entry.route && !heading.find('.headerlink').length) {
      heading.append($('<a class="headerlink" title="链接到本节">¶</a>').attr('href', '#' + id));
    }
    headings.push({ id, title, depth: Number(element.tagName.slice(1)) });
  });
  $('a[href],img[src]').each((_, element) => {
    const item = $(element);
    const attr = element.tagName === 'a' ? 'href' : 'src';
    item.attr(attr, localUrl(item.attr(attr)!, entry.file));
  });
  $('pre').each((_, element) => {
    const pre = $(element);
    if (!pre.find('code.language-mermaid').length) return;
    const horizontal = /^\s*(?:flowchart|graph)\s+(?:LR|RL)\b/m.test(pre.text());
    pre.addClass('mermaid').wrap(`<div class="kb-diagram${horizontal ? ' kb-diagram--horizontal' : ''}" role="region" aria-label="流程图" tabindex="0"></div>`);
  });
  return { html: $.html(), headings };
}
