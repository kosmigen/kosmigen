# Web Awesome 3.14.0

Source: https://www.npmjs.com/package/@awesome.me/webawesome/v/3.14.0

Official package archive:
https://registry.npmjs.org/@awesome.me/webawesome/-/webawesome-3.14.0.tgz

Archive SHA-1: `1b9296e7ea13fd63b74f530a674255da5cc0b7e8`

This directory contains the package's unmodified `dist-cdn` entry points for
Card and Badge, plus their transitive relative JavaScript imports (15 files).
Keep their directory structure when updating. Card and Badge are imported by
`../../projects.mjs` only when the project gallery is present. The website
entry uses a native link and works independently of component scripts.

`theme.css` retains declaration blocks from the official default palette
(`styles/color/palettes/default.css`) and theme (`styles/themes/default.css`).
Root, palette, and shared declarations are scoped to `.kb-projects`; dark color
declarations are scoped to `[data-md-color-scheme="slate"] .kb-projects`.
Global imports, theme classes, and the unused page-layout rule are omitted.
The site overrides a few color and sizing tokens in `projects.css`.

Web Awesome is MIT licensed (`LICENSE.webawesome.txt`). Its bundled Lit modules retain
their license notices; the Lit BSD-3-Clause license is included in `LICENSE.lit.txt`.
No package installation or network access is needed to build the site.
