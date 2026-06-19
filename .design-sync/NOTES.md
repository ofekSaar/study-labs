# StudyLabs Design Sync — Notes

## Re-sync checklist

Before re-syncing, run:
```
cd frontend && npm run build && cp dist/assets/$(ls dist/assets/*.css | grep -v LessonQuiz | xargs -n1 basename | head -1) src/design-system.css
```
This refreshes `src/design-system.css` from the latest Vite build. The CSS filename hash changes on every rebuild — the buildCmd in `config.json` handles this automatically when using the converter.

## Symlinks required (gitignored)

Two symlinks must exist for the converter to run. They're gitignored — recreate them after a fresh clone:

```bash
# Makes PKG_DIR resolve to frontend/ so the converter finds React
ln -s ../ frontend/node_modules/frontend

# Lets the forked bundle.mjs resolve esbuild from .ds-sync
ln -s ../.ds-sync/node_modules .design-sync/node_modules
```

## Why ContentRenderer is excluded

`frontend/src/components/ContentRenderer.jsx` imports `katex/dist/katex.min.css`, which references `.ttf` font files. The forked `overrides/bundle.mjs` adds a `.ttf` dataurl loader that handles this for other components, but ContentRenderer itself uses `dangerouslySetInnerHTML` with dynamic markdown + LaTeX rendering that doesn't produce stable preview screenshots — so it's excluded via `componentSrcMap: null` in config.

## Tailwind CSS v4 — no standalone CLI

This project uses `@tailwindcss/vite` (v4). There is no standalone `tailwindcss` CLI or `tailwind.config.js`. The only compiled CSS comes from Vite's build output at `dist/assets/index-*.css`. The `design-system.css` file is a stable copy of that output.

## GameMap internal rename

`frontend/src/components/map/GameMap.jsx` was renamed from `const GameMapComponent` to `const GameMap` (and its default export updated) to prevent the internal alias from leaking into the bundle's named exports.

## `bg-orange-500` renders invisible in headless Chromium

During preview verification, `color="bg-orange-500"` on CourseCard produced an invisible icon container in headless Chromium (oklch color space issue). Use `bg-amber-500` instead — it renders correctly and is visually equivalent in the StudyLabs palette.

## ProtectedRoute / ErrorBoundary excluded

These are routing/error-boundary wrappers — they require real React Router and error state to render meaningfully. Excluded via `componentSrcMap: null`.
