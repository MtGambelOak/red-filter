# Red Filter

A Firefox extension that turns web pages red-only for night vision (astronomy, dark-adapted reading). Works on Firefox desktop and Firefox for Android.

- **Luma red** (default): converts every color to its brightness, shown as red only.
- **Strict red**: keeps only the red channel, so green and blue output is exactly zero.
- **Dim slider** to lower brightness further.

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
npm run lint     # web-ext lint
npm start        # launch Firefox with the extension loaded
npm run build    # web-ext-artifacts/*.zip
```

Or load `extension/manifest.json` via `about:debugging` > This Firefox > Load Temporary Add-on.

## Limits

- Only page content is filtered. On Android the browser UI (URL bar, tabs, menus) and other apps stay unfiltered; Firefox for Android has no theming beyond Light/Dark.
- The OS or display can still add green and blue. Color management on wide-gamut panels converts sRGB red into a mix that includes some green and blue, even though the extension outputs exact red. If a color picker shows non-zero green or blue, check the OS "automatically manage color" and HDR settings.
- Pages the extension cannot inject into (`about:`, addons.mozilla.org, built-in PDF viewer) need the optional files in `desktop/` on desktop, and are not coverable on Android.

## License

MIT
