# Habits

A local-first mobile habit tracker PWA.

## Checks

```sh
node --check app.js
node --check sw.js
node tests/app.test.mjs
```

## Offline Mobile Use

Service workers only run on `localhost` or HTTPS. Opening `index.html` directly with `file://` is fine for a quick look, but install/offline mode will not work there.

For local testing:

```sh
python3 -m http.server 4174
```

Then open:

```text
http://localhost:4174/
```

For phone installation, host this folder on any HTTPS static host, open the site on the phone, then use the browser’s Add to Home Screen / Install option. After the first online load, the app shell works offline and habit data stays on that device.
