# Signing, installing, and publishing

Release Firefox (desktop and Android) only installs extensions signed by Mozilla. Signing is free and goes through addons.mozilla.org (AMO).

The extension ID (`red-filter@mtgambeloak.github.io` in `extension/manifest.json`) becomes permanent once you sign or publish. Don't change it afterward, or users lose updates and stored settings.

## 1. Get API credentials (once)

1. Create or log in to a Mozilla account and open the [AMO Developer Hub](https://addons.mozilla.org/developers/).
2. Go to Tools > Manage API Keys and generate credentials. You get a JWT issuer (`user:...`) and a JWT secret.
3. Put them in a local `.env` (already git-ignored) and never commit them:

```
WEB_EXT_API_KEY=user:12345:67
WEB_EXT_API_SECRET=your-secret
```

## 2. Option A: self-distribute (unlisted, fastest)

```
set -a; source .env; set +a
npm run sign:unlisted
```

This uploads the extension, waits for automatic signing (usually minutes, no human review), and writes a signed `.xpi` to `web-ext-artifacts/`. Bump `version` in `extension/manifest.json` and `package.json` for every new signing; AMO rejects a repeated version.

- **Desktop:** open the signed `.xpi` in Firefox, or drag it into a window.
- **Android:** Firefox for Android does not install self-hosted `.xpi` links from the web. A forum-reported route (verify on your version): tap the Firefox logo in Settings > About Firefox repeatedly to enable the debug menu, then Settings > Extensions > Install extension from file. Otherwise use option B.

## 3. Option B: list it on the Mozilla add-ons site (public)

Listed add-ons are installable from AMO on desktop and Android with no side steps, and Firefox for Android shows any listed extension that declares Android compatibility (`gecko_android` in the manifest, already set).

1. Build the package: `npm run build` and take the zip from `web-ext-artifacts/`.
2. Go to the Developer Hub > Submit a New Add-on > choose "On this site" (listed).
3. Upload the zip. Tick both Firefox and Firefox for Android compatibility.
4. Fill in the listing: name, summary, description, category (for example Accessibility or Appearance), a license (MIT), a support URL (this GitHub repo), and a privacy statement. The extension collects no data (`data_collection_permissions: none` is declared in the manifest), so say that. Add a screenshot or two of a filtered page.
5. No source-code upload is needed: the extension is plain JavaScript with no build step or minification.
6. Submit. New listed add-ons go through automated checks plus possible human review; expect anything from hours to a few days. Later versions upload the same way via "Upload New Version".

## Pre-flight checklist

- `npm run lint` shows zero errors and warnings.
- Version bumped in both `extension/manifest.json` and `package.json`.
- Tested in desktop Firefox (`npm start`) and, if you can, Firefox Nightly on Android.

## Desktop-only extras

`desktop/userChrome.css` and `desktop/userContent.css` are not part of the extension and can't be shipped through AMO. They're optional manual installs for `about:` pages and the toolbar; see `desktop/INSTALL.txt`.
