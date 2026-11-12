# Yorna website

Marketing site for Yorna: Home, Features and Get started pages. Vite + React + TypeScript, Tailwind CSS v4 and React Router. It's a separate package from the app, with its own dependencies.

```bash
cd website
npm install
npm run dev        # http://localhost:47391
npm run build      # static output in website/dist
npm run preview    # serve the build on :47392
```

The site uses client-side routes (`/features`, `/download`), so static hosts need a fallback that serves `index.html` for unknown paths.

## Design rules

Flat only: solid fills, 1–2px ink rules, simple line icons (lucide). No shadows, gradients, blur, glow or glass. The palette comes from the app: ink `#191716`, cream `#eee8e1`, star amber `#f2b544` and the reminder colors (coral, rose, sky, mint), on a warm paper background `#f5efe6`. Display type is Bricolage Grotesque; body type is Inter, as in the app.

## Product screenshots

`public/product/*.webp` are captured from the real app with seeded sample data:

```bash
# terminal 1, repo root
npm run web
# terminal 2
cd website && npm run capture:product
```

The script drives Chrome through `puppeteer-core`; set `CHROME_PATH` if Chrome isn't at `/usr/local/bin/google-chrome`, and `YORNA_URL` if the app runs somewhere other than `http://127.0.0.1:43127`. It overwrites the browser build's IndexedDB vault for that origin.
