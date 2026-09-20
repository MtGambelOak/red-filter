# addons.mozilla.org listing (draft)

Draft for review. Nothing here has been submitted.

## Name

Nighttime Red Light

## Summary (max 250 characters)

Turn web pages red-only so the screen is easier on your eyes and body clock at night. Pick strict or luma red, dim the screen, and schedule it by time or by sunset and sunrise. Collects no data.

## Description

Nighttime Red Light turns every web page red-only, so late-night browsing is easier on your eyes and less likely to get in the way of winding down for sleep. Blue-rich light is the part of screen light most associated with disrupting your body clock, and red is the gentlest color to look at before bed. It is also handy anywhere you want to keep your eyes dark-adapted, such as stargazing.

**How it works**

Most night-time filters tint the screen, so blue and green light still leak through. This extension multiplies each page by pure red instead, so the green and blue output of page content is exactly zero. It is not a see-through overlay: text stays sharp and contrast is kept.

**Features**

- Two modes: Luma red (the default, which keeps brightness and contrast by showing each color as its brightness in red) and Strict red (keeps only the red channel).
- Dim slider, so you can go as dark as you like.
- Scheduling: turn it on manually, at set start and stop times, or automatically from sunset to sunrise for your city, with optional minute offsets. Search about 70,000 places offline, or enter coordinates.
- Also filters dialogs and popovers, which browsers draw above normal page content.
- Optional: recolors the Firefox toolbar red on desktop.
- Works on Firefox for Android.

**Privacy**

No data is collected and the extension makes no network requests. Settings stay in your browser's local storage. Sunrise and sunset are calculated on your device from a bundled place list.

**Limits**

- Only web page content is filtered. Firefox's own interface (on Android: the address bar, tabs and menus) and other apps are not. On desktop the toolbar can be recolored.
- Pages Firefox does not let extensions change (about: pages, addons.mozilla.org, the built-in PDF viewer) are not filtered.
- Your operating system or monitor can still add green and blue light. Color management on wide-gamut displays converts pure sRGB red into a mix that includes some green and blue. If you need the strictest result, check your OS color management settings. For a system-wide filter on Windows, see RedLight.

**Credits**

Inspired by RedLight by Michael Mawhinney (https://github.com/michaelmawhinney/redlight). Sunrise and sunset math uses SunCalc (BSD-2-Clause). The place list is derived from GeoNames (CC BY 4.0). Open source under the MIT license: https://github.com/MtGambelOak/red-filter

## Listing fields

| Field | Value |
|---|---|
| Categories | Firefox: Appearance. Android: pick the closest available (verify in the Developer Hub) |
| Tags | night mode, red filter, sleep, circadian rhythm, blue light, eye strain, dark, schedule, astronomy |
| License | MIT |
| Support site | https://github.com/MtGambelOak/red-filter/issues |
| Homepage | https://github.com/MtGambelOak/red-filter |
| Support email | lucas@lpearce.dev |
| Privacy policy | None needed: no data is collected (declared in the manifest as `data_collection_permissions: none`) |

## Screenshots

1. `1-filtered-page.png`: a filtered web page
2. `2-before-after.png`: original vs filtered, split down the middle
3. `3-settings.png`: filter mode, dim slider and extras
4. `4-city-search.png`: searching for a city for sunset scheduling
5. `5-sunset-schedule.png`: city chosen, with today's sunset and sunrise

## Notes to reviewer

The extension is plain JavaScript with no build step, minification or transpiling, so the uploaded package is the source.

- `extension/lib/suncalc.js` is the unmodified SunCalc 1.9.0 library from npm (BSD-2-Clause, license file alongside).
- `extension/data/cities.tsv` is generated from GeoNames data by `scripts/build-cities.py`.
- Permissions: `<all_urls>` is required to apply the filter on every page; `storage` keeps settings; `theme` recolors the Firefox toolbar (desktop, optional in settings); `alarms` re-checks the schedule once a minute so the toolbar theme follows sunset and sunrise.
- The extension makes no network requests and has no remote code.
- Full source: https://github.com/MtGambelOak/red-filter

To test: install, open any web page and it turns red. Open the toolbar popup to switch mode, dim, or set a schedule.
