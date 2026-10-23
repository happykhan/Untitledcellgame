# Vendored renderer dependency

`three.mjs` is a minified, tree-shaken ESM bundle of the exports listed in `three-exports.mjs`, from **Three.js 0.186.1**. It is served locally so rendering does not depend on another CDN at runtime. Its MIT licence is preserved in `THREE-LICENSE.txt` and the bundle's licence comments.

The game needs no package installation or build step. To regenerate this dependency for development, use the pinned upstream package and esbuild:

```
esbuild vendor/three-exports.mjs --bundle --minify --format=esm --outfile=vendor/three.mjs --legal-comments=inline
```

This expects `three@0.186.1` and esbuild in the development environment. Do not hand-edit the generated bundle. Upstream: https://github.com/mrdoob/three.js/tree/r186
