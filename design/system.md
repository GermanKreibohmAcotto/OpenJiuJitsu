# OpenJiuJitsu design system

Synced from the project sources. Only values found in the sources are recorded.

## Colors

| Token | Value | Usage | Source |
| --- | --- | --- | --- |
| `--color-bg` | `#0b0d10` | Page background, PWA theme color | `src/index.css` |
| `--color-surface` | `#14171c` | Cards | `src/index.css` |
| `--color-surface-2` | `#1b1f26` | Buttons, inputs, chips | `src/index.css` |
| `--color-line` | `#262b33` | Borders and dividers | `src/index.css` |
| `--color-muted` | `#8b93a1` | Secondary text, labels | `src/index.css` |
| `--color-accent` | `#ef4444` | Primary actions, active state, focus ring, scrollbar | `src/index.css` |
| `--color-accent-ink` | `#ffffff` | Text on accent | `src/index.css` |
| `--color-danger` | `#f87171` | Destructive actions | `src/index.css` |
| text (zinc-100) | `#f4f4f5` | Body text | `src/index.css` (`text-zinc-100`) |
| belt white | `#f4f4f5` | Accent that follows a white belt | `src/app/accent.ts` |
| belt blue | `#3b82f6` | Accent that follows a blue belt | `src/app/accent.ts` |
| belt purple | `#a855f7` | Accent that follows a purple belt | `src/app/accent.ts` |
| belt brown | `#c2813b` | Accent that follows a brown belt | `src/app/accent.ts` |
| belt black | `#ef4444` | Accent that follows a black belt | `src/app/accent.ts` |
| belt tip | `#0a0a0a` | Black belt tip behind the stripes | `public/icon.svg` |

## Typography

| Token | Value | Usage | Source |
| --- | --- | --- | --- |
| `--font-display` | `'Dela Gothic One', 'Barlow', ui-sans-serif, system-ui, sans-serif` | Logo, headings | `src/index.css` |
| `--font-sans` | `'Barlow', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` | Body, UI | `src/index.css` |

Loaded weights: Dela Gothic One 400; Barlow 400, 500, 600, 700 (`src/main.tsx`). `font-synthesis: none`.
Labels: `text-xs`, medium, uppercase, wide tracking, muted.

Artboards are self-contained and cannot load the web fonts: they fall back to the system part of each stack.

## Radius

| Use | Value | Source |
| --- | --- | --- |
| Cards | `rounded-2xl` (16px) | `src/index.css` `.card` |
| Buttons, inputs | `rounded-xl` (12px) | `src/index.css` `.btn`, `.input` |
| Chips | `rounded-full` | `src/index.css` `.chip` |

## Spacing

Tailwind default scale. Cards `p-4` (16px); buttons `px-4 py-2`; inputs `px-3 py-2`; main content `max-w-5xl` with `px-4`.

## Shadows

None as tokens; the primary Home tab uses `shadow-lg` (`src/app/Layout.tsx`). Surfaces are separated by borders, not shadows.

## Components

- `.card`: surface background, 1px line border, 16px radius, 16px padding.
- `.btn`: surface-2 background, line border, 12px radius, `text-sm` medium; hover border zinc-500.
- `.btn-primary`: accent background and border, accent-ink text, hover brightness 110%.
- `.btn-ghost`: transparent; hover surface-2.
- `.btn-danger`: danger text, danger/40 border.
- `.input`: surface-2, line border, 12px radius; focus border accent.
- `.chip` / `.chip-active`: pill, `text-xs`; active uses accent border, accent/15 background, accent text.
- Focus: 2px accent outline, 2px offset.
- Logo: `Open` + `JiuJitsu` in accent, display font.
