# Red Filter

A Firefox extension that turns web pages red-only for night vision (astronomy, dark-adapted reading). Works on Firefox desktop and Firefox for Android.

- **Luma red** (default): converts every color to its brightness, shown as red only.
- **Strict red**: keeps only the red channel, so green and blue output is exactly zero.
- **Dim slider** to lower brightness further.
- **Scheduling**: turn on manually, at set start/stop times, or from sunset to sunrise for a chosen city (offline search of about 70,000 places, or enter coordinates), with optional minute offsets.
- **Toggles**: filter dialogs and popovers, and recolor the Firefox toolbar (desktop only).

It works by laying fixed, click-through `mix-blend-mode` layers over the page (multiplying by pure red zeroes green and blue exactly, with no alpha leakage), plus a matching filter on modal dialogs and popovers, which render above any overlay. On desktop it also recolors the Firefox toolbar via the `theme` API.

## Layout

| Path | What |
|---|---|
| `extension/` | The extension (MV2, works on desktop and Android) |
| `desktop/` | Optional desktop-only `userChrome.css` / `userContent.css` for `about:` pages, the PDF viewer, and the toolbar |
| `docs/PUBLISHING.md` | Signing, installing on Android, and submitting to addons.mozilla.org |

## Develop

```
npm install
npm test         # schedule and sunrise/sunset logic tests
npm run lint     # web-ext lint
npm start        # launch Firefox with the extension loaded
npm run build    # web-ext-artifacts/*.zip
```

Or load `extension/manifest.json` via `about:debugging` > This Firefox > Load Temporary Add-on.

## Limits

- Only page content is filtered. On Android the browser UI (URL bar, tabs, menus) and other apps stay unfiltered; Firefox for Android has no theming beyond Light/Dark.
- The OS or display can still add green and blue. Color management on wide-gamut panels converts sRGB red into a mix that includes some green and blue, even though the extension outputs exact red. If a color picker shows non-zero green or blue, check the OS "automatically manage color" and HDR settings.
- Pages the extension cannot inject into (`about:`, addons.mozilla.org, built-in PDF viewer) need the optional files in `desktop/` on desktop, and are not coverable on Android.

## Inspiration

Inspired by [RedLight](https://github.com/michaelmawhinney/redlight) by Michael Mawhinney, a Windows tray app that applies a red-only display filter. The luma-red and strict-red modes here follow its two modes. RedLight is recommended for Windows, as it operates on a system-wide level. This extension was developed primarily for Android use as most Android-based OSes do not support such system wide tools for truly converting pixels to red, however, web on Android works well enough. For Ubuntu, there is the Night Light GNOME extension.

## Credits and data

- Sunrise and sunset math uses [SunCalc](https://github.com/mourner/suncalc) by Vladimir Agafonkin (BSD-2-Clause), vendored in `extension/lib/`.
- The place list in `extension/data/cities.tsv` (about 70,000 places with over 5,000 people) is derived from [GeoNames](https://www.geonames.org) (CC BY 4.0). Regenerate it with `scripts/build-cities.py`. Everything runs offline; the extension makes no network requests.

## License

MIT
