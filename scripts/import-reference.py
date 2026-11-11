"""Import the published content and presentation fragments from a local reference build."""
import hashlib
import json
import re
import sys
from pathlib import Path
from html.parser import HTMLParser

root = Path(__file__).resolve().parents[1]
reference = Path(sys.argv[1]).resolve()
data = root / 'content' / 'imported'
routes = {}
parts = data / 'fragments'
parts.mkdir(parents=True, exist_ok=True)


def fragment(markup):
    markup = markup.strip()
    if not markup:
        return None
    key = hashlib.sha256(markup.encode()).hexdigest()[:20]
    (parts / f'{key}.html').write_text(markup + '\n', encoding='utf-8')
    return key


def article_name(route):
    return (route if route.endswith('.html') else route + 'index.html')


class ContentBounds(HTMLParser):
    """Locate the content container without depending on article layout."""
    def __init__(self, html):
        super().__init__()
        self.line_offsets = [0] + [m.end() for m in re.finditer(r'\n', html)]
        self.depth = None
        self.bounds = None
        self.feed(html)

    def absolute_offset(self):
        line, col = self.getpos()
        return self.line_offsets[line - 1] + col

    def handle_starttag(self, tag, attrs):
        if tag != 'div':
            return
        if self.depth is not None:
            self.depth += 1
        elif dict(attrs).get('data-md-component') == 'content':
            self.start = self.absolute_offset()
            self.inner = self.start + len(self.get_starttag_text())
            self.depth = 1

    def handle_endtag(self, tag):
        if tag == 'div' and self.depth is not None:
            self.depth -= 1
            if self.depth == 0:
                self.bounds = (self.start, self.inner, self.absolute_offset(), self.absolute_offset() + len('</div>'))
                self.depth = None


for file in sorted(reference.rglob('*.html')):
    relative = file.relative_to(reference).as_posix()
    route = relative.removesuffix('index.html')
    html = file.read_text(encoding='utf-8')
    if route == '404/':
        alias = root / 'public' / '404' / 'index.html'
        alias.parent.mkdir(parents=True, exist_ok=True)
        alias.write_text(re.sub(r'<meta name="generator" content="[^"]*">', '<meta name="generator" content="Astro">', html), encoding='utf-8')
    head = re.search(r'<head>(.*?)</head>', html, re.S)[1]
    head = re.sub(r'<meta name="generator" content="[^"]*">', '', head)
    body = re.search(r'<body([^>]*)>(.*?)</body>', html, re.S)[2]
    prelude, main = body.split('<main class="md-main" data-md-component="main">', 1)
    main, after_main = main.rsplit('</main>', 1)
    start, inner, close, end = ContentBounds(main).bounds
    article_path = data / 'pages' / article_name(route)
    article_path.parent.mkdir(parents=True, exist_ok=True)
    article_path.write_text(main[inner:close].strip() + '\n', encoding='utf-8')
    routes[route] = {
        'head': fragment(head),
        'prelude': fragment(prelude),
        'sidebars': fragment(main[:start]),
        'mainTail': fragment(main[end:]),
        'afterMain': fragment(after_main),
    }

(data / 'routes.json').write_text(json.dumps(routes, ensure_ascii=False, indent=2) + '\n')
(data / 'search-index.json').write_bytes((reference / 'search/search_index.json').read_bytes())
for asset in ['sitemap.xml', 'sitemap.xml.gz', 'tags.json']:
    (root / 'public' / asset).write_bytes((reference / asset).read_bytes())
print(f'Imported {len(routes)} routes and {len(list(parts.glob("*.html")))} distinct fragments.')
