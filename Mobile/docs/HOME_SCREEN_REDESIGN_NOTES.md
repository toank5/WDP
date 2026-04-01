# Home Screen Redesign Notes

## Old vs New Layout

Old Home layout (before):
- Single hero + mixed sections with inconsistent hierarchy.
- Product list grid appeared too early, reducing scannability.
- Search entry and utility shortcuts were not clearly prioritized.
- No clear section system for New Arrivals / Best Sellers / Recommendations.

New Home layout (now):
- Top app bar with direct Search, Cart (badge), Account access.
- Obvious search entry row near top.
- Hero promotion block with one strong primary CTA.
- Quick category shortcuts in horizontal chip row.
- Trust/utility row (returns, warranty, shipping).
- Quick actions for returning users (Favorites, Orders, Cart).
- Product sections as vertical blocks with horizontal carousels:
  - New arrivals
  - Best sellers
  - Recommended for you (shown when available)
- Graceful empty and error states.

## Data Sources and Placeholder Logic

Real data used:
- Products are loaded from the existing products API (`getAllProducts`).

Derived feeds (temporary until dedicated APIs are ready):
- New arrivals: newest by `createdAt`.
- Best sellers: products tagged as `best`/`bestseller`/`popular`/`hot`; fallback to recently updated items.
- Recommended for you: shown for authenticated users; prioritizes `recommended`/`new` tags with fallback items.

Graceful behavior:
- If product feeds are empty, sections render without crashing and an empty-state prompt is shown.
- Recommendations block is hidden when no recommendation candidates exist.

## Shared Components Added

Implemented reusable Home components in `src/components/home/HomeComponents.tsx`:
- `HomeTopBar`
- `SearchEntry`
- `HomeSectionHeader`
- `CategoryShortcutRow`
- `ProductCarousel`
- `TrustRow`

These are exported via `src/components/index.ts`.
