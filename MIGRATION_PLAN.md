# Gatsby to Next.js Migration Plan

## Context

kingnitram.com/site is a portfolio site for art and music, currently built with Gatsby 5 + WordPress GraphQL + React 18 + TypeScript + SCSS. It's hosted as static files on Bluehost. The site has 500+ posts organized in a hierarchy of categories > tags > posts, with features like persistent audio playback, horizontal swipe carousels, infinite scroll with URL updating, and grid/list display modes.

**Why rebuild**: Gatsby's slow builds, convoluted iframe architecture (for audio persistence), complex cross-frame messaging, and over-engineered state layer make the site hard to maintain and extend. Next.js App Router eliminates most of these structural hacks natively.

**Target**: Next.js 15 App Router with static export, Zustand for state, same WordPress backend, same visual styles. New repository.

**Gatsby source project**: `../kn-wp-site`

---

## Critical Constraints

- **Static export only** (`output: 'export'`) — Bluehost has no Node.js runtime
- No ISR, no runtime server components, no API routes, no middleware
- `next/image` optimization unavailable — use existing CDN srcSet (already working)
- `basePath: '/site'` replaces Gatsby's `pathPrefix`
- .htaccess on Bluehost currently redirects to site-frame — must be updated at cutover
- 500+ posts — WPGraphQL pagination required (cursor-based, batched fetches)

---

## Phase 0: Project Scaffolding

1. Initialize Next.js 15 with App Router, TypeScript, SCSS
2. Configure `next.config.ts`:
   - `output: 'export'`
   - `basePath: '/site'`
   - `images: { unoptimized: true }`
3. Set up `next/font` for Montserrat + Merriweather in root layout
4. Copy over `src/css/normalize.css` and `src/css/style.css` from Gatsby project, import in root layout
5. Copy static assets (favicon, robots.txt) into `public/`
6. Copy logo images into `public/images/`
7. Verify `npm run build` produces `out/` directory
8. Adapt deploy script from Gatsby project (change build dir from `public` to `out`, remove `patchGatsbyPrefixPath`)

**Milestone**: Empty site builds and can be deployed.

---

## Phase 1: Data Layer

### WordPress GraphQL Fetch (`lib/wordpress.ts`)
- Direct `fetch()` to `https://kingnitram.com/admin/graphql`
- Rewrite queries for native WPGraphQL schema (`categories`, `posts`, `tags` with `nodes`)
- **Handle pagination**: WPGraphQL defaults to small page sizes. Use cursor-based pagination (`first: 100, after: $cursor`) in a loop to fetch all 500+ posts
- Parse `cdnFeaturedImageRaw` JSON string → `CdnFeaturedImage` object (replicate Gatsby resolver)

### Store Generation (`lib/store.ts`)
- Port `generateStore()` from `../kn-wp-site/gatsby-utils/store-manager.ts` (category/post/tag maps)
- Port `buildSiteScopes()` (hierarchical category > tag > post structure)
- Port `orderSiteScopes()` from `../kn-wp-site/gatsby-utils/sort-manager.ts`

### Types (`lib/types.ts`)
- Port all types from `../kn-wp-site/gatsby-node.ts`: `Category`, `Tag`, `TagWithRelationships`, `Post`, `PostWithRelationships`, `PostMeta`, `CdnFeaturedImage`

### Build-time Cache (`lib/data.ts`)
- Single `getSiteData()` async function that fetches + builds store + scopes
- Module-level cache so it's only computed once per build process
- Exports: `getStore()`, `getSiteScopes()`, `getPostBySlug()`, `getCategoryBySlug()`

### Content Processing
- Evaluate whether `fixFigureNodesInPost()` from `../kn-wp-site/gatsby-utils/wp-post-content.ts` is still needed (it fixed Gatsby-specific duplicate IDs). Test with raw WP HTML first.

**Milestone**: `getSiteData()` returns the same Store and SiteData[] as the current Gatsby build.

---

## Phase 2: Route Structure

### App Router file structure
```
app/
  layout.tsx              → root layout (audio player, providers, global styles)
  page.tsx                → /site/ root → client redirect to /music
  not-found.tsx           → 404 page
  [categorySlug]/
    page.tsx              → category feed pages (generateStaticParams)
    [postSlug]/
      page.tsx            → individual post pages (generateStaticParams)
```

### Page generation
- `[categorySlug]/page.tsx` → `generateStaticParams()` returns all category slugs
- `[categorySlug]/[postSlug]/page.tsx` → `generateStaticParams()` returns all `{ categorySlug, postSlug }` pairs
- Root `page.tsx` → client component with `useRouter().replace('/music')` (static export safe)

### Data flow
- Pages are server components that call `getSiteData()` at build time
- Pass store/scopes as props to client component wrappers
- Each post page receives its specific post + full store for navigation context

**Milestone**: `next build` generates HTML files at all expected URL paths.

---

## Phase 3: State Management (Zustand)

### `useAudioStore`
```
currentTrack: { postId, src, title, thumb, link } | null
isPlaying: boolean
waveSurfer: WaveSurfer | null
play(track) / pause() / resume() / setWaveSurfer(ws)
```

### `useNavigationStore`
```
currentPost: PostWithRelationships | null
tagSwipeMap: Record<string, number>
setCurrentPost(post) / setTagSwipeFor(tagId, index)
```

### `useSettingsStore`
```
displayMode: 'grid' | 'list'
setDisplayMode(mode)
```
Persisted to localStorage.

### Static data
Store and SiteData[] are NOT in Zustand (they're immutable build-time data). Provided via a lightweight React Context from root layout, or passed as props.

**Milestone**: Stores created with TypeScript types.

---

## Phase 4: Root Layout + Audio Player

The root layout replaces the entire iframe architecture:

```
layout.tsx:
  <StoreProvider store={store} siteScopes={siteScopes}>
    <div className="site-frame">
      <main className="site-frame__top">{children}</main>
      <AudioPlayer className="site-frame__bot" />
    </div>
  </StoreProvider>
```

- `AudioPlayer` is a client component reading from `useAudioStore`
- WaveSurfer.js setup logic ported from current `useWaveSurfer` hook in `../kn-wp-site`
- All `postMessage` calls eliminated — replaced by direct Zustand reads/writes
- Audio persists across navigation because layout never unmounts

**Milestone**: Audio player renders, plays a track, persists across Link navigation.

---

## Phase 5: Component Migration

### Reuse with minimal changes (remove Gatsby imports, swap Link)
- `VirtualizedItem` — framework-agnostic (intersection observer + ResizeObserver)
- `MediaListener` — pure React context with matchMedia
- `TagGrid` — native `<img srcSet>`, no Gatsby APIs
- `TagList` — CSS scroll-snap, refs, ResizeObserver
- `TagNavigation` — pure UI
- `DefaultPost` — html-react-parser on post.content (must be client component)
- `SiteMap` — store data + context only
- `FooterNavigation` — links only
- All icons, utility hooks (`useRefFunction`, `useUpdatedRef`, `useResizeAndMutateObserver`)

### Moderate rewrite
- `Header` — replace `useStaticQuery`/`StaticImage` with props + `<img>` or `next/image`
- `AudioPost` — replace postMessage dispatch with `useAudioStore.play()`
- `Post` — intersection observer stays, `setCurrentPost` → Zustand
- `CategoryAhref`/`PostAhref`/`TagAhref` — `GatsbyLink` → `next/link`
- `Breadcrumbs` — same link swap
- `url-manager.ts` — remove `withPrefix`, remove `postMessage` to parent frame

### Significant rewrite / elimination
- `SiteContext.tsx` → eliminated, replaced by Zustand + static data context
- `feed-content/index.tsx` (template) → logic splits into route page components
- `useAudioPlayerMessaging.ts` → eliminated, replaced by `useAudioStore`
- `usePostMessageStatus.ts` → eliminated (iframe-only)
- `site-frame/index.tsx` → eliminated (it IS the layout now)
- `audio-player/index.tsx` → eliminated (it's a component in the layout)
- `seo.tsx` → replaced by Next.js Metadata API (`generateMetadata`)

### SCSS
- All `.scss` files copy directly (Next.js + sass package supports them)
- Global `style.css` and `normalize.css` imported in root layout
- No CSS modules needed (keep BEM convention)

### Images
- Continue using CDN srcSet in `<img>` tags (same as current TagGrid pattern)
- Logo images: replace `StaticImage` with plain `<img>` from `public/images/`
- `images: { unoptimized: true }` in next.config if using `next/image` anywhere

**Milestone**: All pages render visually identical to current site.

---

## Phase 6: Interactive Features

### URL updating on scroll
- Intersection Observer in `Post` → Zustand `setCurrentPost` → `window.history.replaceState`
- No iframe messaging needed — single window, single DOM
- Use `replaceState` (not `pushState`) so back button isn't polluted with scroll positions
- Create `withBasePath(path)` utility for manual URL construction

### Deep linking (`?t=tag-slug`)
- Port the sequential-scroll hack from `useCurrentPost` (lines 62-95 in `../kn-wp-site`)
- Consider improvement: for deep-link scenarios, render preceding tags non-virtualized

### Display mode toggle
- `useSettingsStore` with localStorage persistence
- Auto-switch to list on small screens (port from `useManageSettings`)

**Milestone**: Full interactive parity with current site.

---

## Phase 7: SEO + Metadata

- Replace `react-helmet` with Next.js `generateMetadata` in each page
- Post pages: title, description, OG image from cdnFeaturedImage
- Category pages: category name as title
- Root layout: default site title/description from WordPress general settings

**Milestone**: Social sharing previews work for all URLs.

---

## Phase 8: Deploy + Cutover

### Deploy script changes
- `consts.mjs`: `LOCAL_BUILD_DIRECTORY` → `'out'`
- `index.mjs`: remove `patchGatsbyPrefixPath()` function
- `sync-to-destination.sh`: source dir `out` instead of `public`
- `package.json` scripts: `next build` instead of `gatsby build`

### .htaccess update
- The existing .htaccess on Bluehost redirects content URLs to site-frame
- This MUST be updated/removed at cutover — each URL now serves a complete HTML page
- Include .htaccess update in the deploy script, or document as a manual step

### Cutover checklist
- [ ] All URLs produce correct static HTML
- [ ] Audio player persists across navigation
- [ ] Horizontal swipe works in all tags
- [ ] URL updates on scroll
- [ ] Deep links work (direct URL access)
- [ ] Social sharing previews correct
- [ ] Grid/list toggle works
- [ ] SiteMap reflects current content
- [ ] 404 page works
- [ ] Mobile responsive behavior matches
- [ ] .htaccess updated on server
- [ ] Old Gatsby deploy backed up

---

## Blind Spots Identified

### 1. WPGraphQL Pagination (HIGH RISK)
500+ posts need cursor-based pagination. WPGraphQL defaults to 10 per page, max typically 100. Must implement a fetch loop. If the max is too low, may need to adjust WPGraphQL settings on the WordPress side.

### 2. .htaccess Removal Timing (MEDIUM RISK)
Current .htaccess redirects to site-frame. New site doesn't have site-frame. If .htaccess is updated before new site is deployed, or vice versa, there will be a brief breakage window. Solution: deploy new site first, update .htaccess immediately after, or include it in the rsync.

### 3. SiteMap Scroll Handler Bug (LOW RISK, existing bug)
`SiteMap/index.tsx` in the Gatsby project uses `useMemo` with side effects (scroll listeners). In the new single-window architecture, this needs to listen on the correct scrollable element, not `window`. Fix during migration.

### 4. WordPress HTML Content (MEDIUM RISK)
Post content may contain scripts, embeds, iframes. `html-react-parser` handles this but components using it must be client components. Test with representative content early.

### 5. Static Export Route Coverage (LOW RISK)
Every `replaceState` URL must have a corresponding static HTML file. Since `generateStaticParams` covers all posts and categories, this should work. But any dynamic URL not covered will 404 on hard refresh. Verify the `out/` directory structure matches all expected URLs.

### 6. Build Time with 500+ Pages (LOW RISK)
Next.js static export generates one HTML file per route. With 500+ posts + categories, expect a few minutes. Still faster than Gatsby since there's no image processing pipeline. Monitor and optimize if needed.

### 7. Font Loading Flash
Switching from `typeface-*` packages (bundled fonts) to `next/font` (optimized loading) may change the font loading behavior slightly. `next/font` is better (no FOIT/FOUT) but test visually.

### 8. `withPrefix` → `basePath` Completeness
Five files in the Gatsby project use `withPrefix`. All manual URL construction (e.g., `window.history.pushState`, audio URLs) must account for basePath. Create a single `withBasePath()` utility and grep for any missed instances.

---

## Gatsby Source Files Reference

### Source of truth for logic (in `../kn-wp-site`)
- `gatsby-node.ts` — GraphQL queries, types, page creation, cdnFeaturedImage resolver
- `gatsby-utils/store-manager.ts` — generateStore, buildSiteScopes
- `gatsby-utils/sort-manager.ts` — ordering logic
- `gatsby-utils/wp-post-content.ts` — HTML content processing
- `src/components/Site/SiteContext.tsx` — full state architecture being replaced
- `src/pages/site-frame/index.tsx` — postMessage protocol reference
- `src/hooks/useAudioPlayerMessaging.ts` — audio state management reference
- `src/hooks/useCurrentPost.tsx` — post tracking + deep-link scrolling
- `src/utils/scope-manager.ts` — scope/neighbor traversal (reuse directly)
- `src/utils/url-manager.ts` — browser address management
- `dev-ops/deploy-bluehost/` — deploy scripts to adapt

### Reusable code (copy + adapt from `../kn-wp-site`)
- `src/components/VirtualizedItem/` — virtualization
- `src/components/Tag/TagList/` — swipe carousel
- `src/components/Tag/TagGrid/` — grid layout
- `src/components/MediaListener/` — responsive breakpoints
- `src/hooks/useRefFunction.ts`, `useUpdatedRef.ts` — utility hooks
- `src/css/style.css`, `src/css/normalize.css` — global styles
- All component `.scss` files
