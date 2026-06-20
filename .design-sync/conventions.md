# StudyLabs Design System — Conventions

## No provider needed

Components render standalone. Zustand stores (`gamificationStore`, `courseStore`) self-initialize with safe defaults, so gamification components (BadgeDisplay, QuestPanel, StreakCalendar, etc.) render their empty/default state without any wrapper. No ThemeProvider or RouterProvider is required for rendering.

Exception: layout shell components (AdminLayout, InstructorLayout, StudentLayout, MainLayout) use React Router's `<Outlet />` — they render a blank content area without a Router context, which is fine for composition mockups.

## Styling idiom — two layers

**Layer 1: Tailwind utility classes.** Use standard Tailwind classes directly — the full compiled set is in `_ds_bundle.css`. Reliable colour families: `indigo`, `purple`, `emerald`, `slate`, `amber`, `rose`. Avoid dynamically constructing class strings; pass the full class name (e.g. `"bg-indigo-500"`, not `"bg-" + color`).

**Layer 2: Custom component classes** defined in `_ds_bundle.css`:
- `.glass-card` — frosted glass surface (white/70% bg, backdrop blur, subtle orange shadow). Use for content cards, panels, and overlays.
- `.sidebar-theme` — white-to-cream gradient sidebar with right border. Use for navigation sidebars.
- `.shimmer` — pulsing skeleton animation. Combine with height/width utilities (e.g. `shimmer h-4 rounded-xl`).
- `.dark` — toggle dark mode on a root element; all `.glass-card` and `.sidebar-theme` variants adapt automatically.

**Brand tokens** (use as `var(--name)` in inline styles or CSS):
- `--color-studylabs-purple` → #7C3AED (primary brand purple)
- `--color-studylabs-blue` → brand blue (buttons, progress, highlights)
- `--color-studylabs-dark` → #C4613D (warm orange-brown, secondary brand)
- `--color-accent-yellow` → #F59E0B (XP, coins, achievement highlights)
- `--font-sans` → Inter (body text)
- `--font-display` → Nunito (headings, badges, bold UI labels)

For game/score displays use `font-family: 'Press Start 2P'` (loaded via Google Fonts at runtime).

## Where the truth lives

Read `styles.css` (which imports `_ds_bundle.css`) for all token definitions, custom classes, and compiled Tailwind utilities. Each component's own `.prompt.md` documents its props and usage.

## Icon pattern

CourseCard, EmptyState, and several dashboard components accept icon components (not elements) as props. Pass a Lucide React component instance:

```jsx
import { BookOpen, Code } from 'lucide-react'; // bundled in window.StudyLabs

// ✓ correct — pass the component as a prop
<CourseCard icon={<BookOpen size={24} />} title="Algorithms" professor="Dr. Cohen" progress={65} color="bg-indigo-500" />

// Using glass-card + shimmer for a loading state
<div className="glass-card rounded-3xl p-6">
  <LoadingSkeleton rows={3} />
</div>

// Empty state with action
<EmptyState icon={BookOpen} title="No courses yet" description="Browse the catalog to get started." action={{ label: 'Browse', onClick: () => {} }} />
```

Lucide icons are bundled — import directly from `'lucide-react'` or reference via `window.StudyLabs`. Do not add a separate CDN link.
