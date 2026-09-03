# tmplat brand assets

Brand assets for the new **tmplat** extension. Everything here is vector-only SVG so it can be recoloured,
rescaled and exported without loss. Nothing here is wired into the build yet — promote what you need into
`src/img/` (raster icons) and `docs/images/promotional/`.

These sit alongside the legacy "Template" assets (`docs/images/promotional/*.png` — brown weave + clipboard), which
belong to the old brand and are not the basis for these.

## The mark

**Stack** — two offset rounded tiles with the `t` monogram on the front tile: the "copy this page" idea, which
is exactly what the extension does. The wordmark uses a geometric, monolinear lowercase construction (round
caps/joins, single stroke weight) that matches the mark.

## Files

| File                                | Use                                                                                       |
| ----------------------------------- | ----------------------------------------------------------------------------------------- |
| `icon-stack.svg`                    | 512×512 app icon — gradient rounded-square tile, white mark. Store listing / large icons. |
| `icon-stack-small.svg`              | Gradient tile with the simplified mark. Source for the 24/32px PNGs.                      |
| `icon-stack-micro.svg`              | Gradient tile with just the `t`. Source for the 16/19px PNGs.                             |
| `icon-stack-mono.svg`               | Transparent background, ink mark. Docs, light UI.                                         |
| `icon-stack-mono-inverse.svg`       | Transparent background, white mark. Dark UI.                                              |
| `icon-stack-toolbar.svg`            | Simplified, heavier-weight mark for 16–24px (`action` toolbar icon, favicon).             |
| `icon-stack-toolbar-inverse.svg`    | As above, white.                                                                          |
| `logo-stack.svg`                    | Horizontal lockup: tile + wordmark, for light backgrounds.                                |
| `logo-stack-inverse.svg`            | Horizontal lockup, all white, for dark/coloured backgrounds.                              |
| `banner-stack-marquee-1400x560.svg` | Chrome Web Store marquee promo tile.                                                      |
| `banner-stack-large-920x680.svg`    | Chrome Web Store large promo tile (stacked lockup).                                       |
| `banner-stack-small-440x280.svg`    | Chrome Web Store small promo tile (no tagline).                                           |
| `wordmark.svg`                      | Wordmark only, ink.                                                                       |
| `wordmark-inverse.svg`              | Wordmark only, white.                                                                     |
| `palette.svg`                       | Colour swatch sheet.                                                                      |
| `contact-sheet.svg`                 | The mark at tile / mono / 100 / 48 / 24 / 19px plus the wordmark. **Start here.**         |

## Palette

| Token          | Hex                   | Notes                                                   |
| -------------- | --------------------- | ------------------------------------------------------- |
| Ink            | `#151A24`             | Wordmark and mono mark on light.                        |
| Ink soft       | `#4A5468`             | Secondary text.                                         |
| Paper          | `#FFFFFF`             | Mark on colour.                                         |
| Gradient       | `#FF8A3D` → `#F5544E` | Icon tile and banners (a warm nod to the legacy brown). |
| Solid fallback | `#FF7A3D`             | Where a gradient isn't available.                       |

## Notes / caveats

- **The mark is stroked, not outlined.** If you scale it non-uniformly, or convert to outlines in another tool,
  check `stroke-width` still resolves as expected. For a fully self-contained file, run "stroke to path" before
  handing off.
- **Banner taglines use live `<text>`** with an `Inter, Helvetica Neue, Arial` stack, and carry the extension's
  own store description verbatim (`src/_locales/en/messages.json` → `description`). If that copy changes, update
  `TAGLINE` and re-export. Convert to outlines before handing the SVGs anywhere the font isn't guaranteed — the
  exported PNGs are unaffected.
- **The toolbar variant exists for a reason.** The full-detail mark goes mushy below ~32px; use
  `icon-stack-toolbar.svg` (or the tiled `icon-stack-small.svg` / `icon-stack-micro.svg`) rather than scaling
  `icon-stack.svg` down.
- **`src/img/icon_*.png` has already been generated from these.** `src/img` is copied wholesale to
  `dist/temp/img` by `rolldown.config.mjs`, and `manifest.json` (`icons` + `action.default_icon`) already points
  at those filenames, so no build or manifest change was needed. Detail grows with size:

  | Sizes               | Source                 |
  | ------------------- | ---------------------- |
  | 16, 19              | `icon-stack-micro.svg` |
  | 24, 32              | `icon-stack-small.svg` |
  | 48, 64, 72, 96, 128 | `icon-stack.svg`       |

  To regenerate with librsvg (`brew install librsvg`):

  ```sh
  for s in 16 19; do rsvg-convert -w $s -h $s docs/images/brand/icon-stack-micro.svg -o src/img/icon_$s.png; done
  for s in 24 32; do rsvg-convert -w $s -h $s docs/images/brand/icon-stack-small.svg -o src/img/icon_$s.png; done
  for s in 48 64 72 96 128; do rsvg-convert -w $s -h $s docs/images/brand/icon-stack.svg -o src/img/icon_$s.png; done
  ```

- **`docs/images/promotional/*.png` has also been generated from these** — `marquee.png`, `large.png` and `small.png`
  are 1:1 exports of the three `banner-stack-*.svg` files, as 24-bit RGB PNGs (no alpha), which is what the
  Chrome Web Store requires:

  ```sh
  rsvg-convert docs/images/brand/banner-stack-marquee-1400x560.svg -o docs/images/promotional/marquee.png
  rsvg-convert docs/images/brand/banner-stack-large-920x680.svg    -o docs/images/promotional/large.png
  rsvg-convert docs/images/brand/banner-stack-small-440x280.svg    -o docs/images/promotional/small.png
  ```

  The SVGs are now the source of truth for these.
