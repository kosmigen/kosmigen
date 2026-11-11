import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const reference = process.argv[2];
const output = 'dist';
const htmlFiles = async (directory) =>
  (await readdir(directory, { recursive: true })).filter((file) => file.endsWith('.html')).sort();
const pageFiles = await htmlFiles(output);
assert(pageFiles.includes('index.html') && pageFiles.includes('404.html'), 'Home or 404 page is missing');
if (reference) {
  assert.deepEqual(pageFiles, await htmlFiles(reference), 'Generated HTML routes differ from the reference');
}
const routes = new Set(pageFiles.map((file) => file.replace(/index\.html$/, '')));

function normalizePage(html) {
  return html.replace(/^\s*<!doctype html>/i, '<!DOCTYPE html>')
    .replace(/<meta name="generator" content="[^"]*">/g, '')
    .replace(/>\s+</g, '><')
    .trim();
}

for (const path of pageFiles) {
  const html = await readFile(join(output, path), 'utf8');
  assert(html.includes('data-md-component="content"'), `Missing page content: ${path}`);
  if (reference) {
    const original = await readFile(join(reference, path), 'utf8');
    assert.equal(normalizePage(html), normalizePage(original), `Page differs: ${path}`);
  }
}
const search = 'search/search_index.json';
const index = JSON.parse(await readFile(join(output, search), 'utf8'));
for (const entry of index.docs) {
  const route = entry.location.split('#')[0];
  assert(routes.has(route), `Search references an unknown route: ${route}`);
}
if (reference) {
  assert.deepEqual(index, JSON.parse(await readFile(join(reference, search), 'utf8')));
  const assets = join(reference, 'assets');
  for (const entry of await readdir(assets, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const source = join(entry.parentPath, entry.name);
    const target = join(output, relative(reference, source));
    assert((await readFile(target)).equals(await readFile(source)), `Asset differs: ${target}`);
  }
}
console.log(`${pageFiles.length} pages and ${index.docs.length} search entries verified.`);
