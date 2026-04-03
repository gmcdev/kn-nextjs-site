# kingnitram.com — Next.js Portfolio Site

## Project Overview

Portfolio site for art and music at kingnitram.com/site. Rebuilt from Gatsby to Next.js App Router.
WordPress backend (WPGraphQL at kingnitram.com/admin/graphql) serves as the CMS.
Deployed as static files to Bluehost via rsync.

The previous Gatsby project lives at `../kn-wp-site` — reference it for existing logic, styles, and components during migration.

## Tech Stack

- **Framework**: Next.js 15 (App Router, static export)
- **Language**: TypeScript
- **State**: Zustand (audio, navigation, settings stores)
- **Styling**: SCSS + CSS Custom Properties (BEM naming, no CSS modules)
- **Fonts**: Montserrat (headings), Merriweather (body) via next/font
- **Audio**: WaveSurfer.js
- **Data**: WordPress GraphQL (fetched at build time)
- **Deploy**: Static export → rsync to Bluehost /public_html/site
- **htaccess**: `public/.htaccess` must be placed in `/public_html` on Bluehost (the domain root, not `/public_html/site`). It handles clean URL rewrites, the root redirect to `/site/music`, and PHP handler config.

## Architecture

### Static Export Constraints
- `output: 'export'` — no server runtime on Bluehost
- No ISR, no server components at runtime, no API routes, no middleware
- `basePath: '/site'` — all URLs prefixed with /site
- `images: { unoptimized: true }` — CDN provides optimized srcSet already

### Data Flow
1. Build time: `lib/data.ts` fetches all categories/tags/posts from WordPress GraphQL
2. Build time: `lib/store.ts` builds Store (ID maps) and SiteData[] (hierarchical scopes)
3. Build time: Pages are server components that receive store/scopes, pass to client wrappers
4. Runtime: Zustand stores manage audio state, current post, display settings
5. Runtime: Static data provided via React Context (immutable, never changes client-side)

### Route Structure
```
app/layout.tsx                            — persistent shell with AudioPlayer
app/page.tsx                              — redirects to /music
app/[categorySlug]/page.tsx               — category feed
app/[categorySlug]/[postSlug]/page.tsx    — individual post
```

### Key Patterns
- **Audio persistence**: AudioPlayer lives in root layout, never unmounts. Zustand store for state.
- **URL on scroll**: Intersection Observer on Posts → Zustand setCurrentPost → window.history.replaceState
- **Horizontal swipe**: CSS scroll-snap-type with JS position tracking per tag
- **Virtualization**: Intersection Observer lazy-renders tag sections
- **CDN images**: WordPress plugin provides srcSet/sizes via cdnFeaturedImage field. Use `<img srcSet>` directly.

## Commands

```bash
npm run dev              # Local development
npm run build            # Static export to out/
npm run deploy           # rsync to Bluehost
npm run build-and-deploy # Full pipeline
```

## Conventions

- Component SCSS files colocated with components (e.g., `components/Tag/style.scss`)
- BEM naming in CSS (`.tag-list__post--active`)
- CSS Custom Properties for all design tokens (defined in `src/css/style.css`)
- Zustand stores in `stores/` directory
- WordPress data fetching in `lib/` directory
- Utility functions in `utils/` directory
- All content components are client components (`'use client'`) — they use browser APIs

## Code Conventions

### General

- Do not abbreviate variable, parameter, or CSS class names (e.g., `previous` not `prev`)
- No `require()` — use ESM `import` only
- Prefer `structuredClone()` over `JSON.parse(JSON.stringify())`
- Prefer `Number.parseInt` over `parseInt` (and other Number globals)

### TypeScript

- Avoid `let` unless absolutely necessary
- Avoid `for` loops unless required for optimization
- Control flow statements should always use curly braces
- Always declare `export default` as a standalone line, separate from the definition it exports
- `null` indicates a known "no value"; `undefined` indicates the value is not yet known
- Functions inside other functions should be declared as `const` with arrow syntax
- Use `??` for fallback expressions, not `||`, unless specifically evaluating two boolean conditions
- Logical statements should be "truth first"
- Always import specific React exports (`ReactNode`, not `React.ReactNode`)
- If `children` are passed to a component, type with `PropsWithChildren`
- Variable names for refs should have `Ref` appended
- Module order:
  1. Imports
  2. Types/interfaces for the default export
  3. Default definition
  4. Export of default
  5. Other types/definitions
  6. Constants and static declarations

### React/JSX

- All component prop types must be `Readonly<{...}>`
- JSX conditionals should resolve to `element | null`, not `undefined | false`. Use `{x ? <Foo /> : null}` not `{x && <Foo />}`
- Do not drill props into child components if they are not shared by siblings in the parent

### HTML

- Do not nest `<button>` elements inside `<button>` elements
- Do not attach event listeners to non-interactive elements (`div`, `span`, `p`, `li`, etc.)

### CSS/SCSS

- All style directives must be ordered alphabetically within class declarations
- Classes should be nested similarly to the composition of the elements

## Important Notes

- The site was previously a Gatsby project with an iframe-based architecture. That is fully eliminated.
- No postMessage, no iframes, no site-frame. The root layout IS the frame.
- `withBasePath(path)` utility must be used for any manually constructed URLs (e.g., pushState).
- `next/link` and `next/navigation` automatically respect basePath — no manual prefixing needed.
- WordPress content HTML is rendered with html-react-parser in client components.
- WPGraphQL pagination is cursor-based. The fetch loop in lib/wordpress.ts handles this.
- 500+ posts — data fetch must handle cursor-based pagination from WPGraphQL.
