# 👶 Baby Stories

A cute photo journal for your little one. Upload photos into albums, give every month of your baby's life its own theme, and turn the memories into a short story video or a single collage image.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build in dist/
npm run preview   # serve the production build
```

## Deploy to GitHub Pages

Live site: **https://tantai30041999.github.io/BabyStories_Project/**

The workflow in `.github/workflows/deploy.yml` builds the app and publishes it every time you push to the repo's **default branch**. Pushes to other branches only run a build check.

One-time setup on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

How it works:
- `BASE_PATH` is set to `/BabyStories_Project/` during the build. Vite uses it for file URLs and React Router uses it as its `basename`. Locally it stays `/`.
- The build also writes `dist/404.html` (a copy of `index.html`). This means refreshing a deep link such as `/albums` opens the app instead of GitHub's 404 page.
- To build like GitHub does on your own machine: `BASE_PATH=/BabyStories_Project/ npm run build` (in Git Bash, put `MSYS_NO_PATHCONV=1` in front).

Photos are stored in each visitor's own browser, so the published site does not contain or share anyone's photos.

## Features

- **Upload (home page)**: one big, cute upload card. Drag & drop, choose, or paste many photos at once (up to 30). Set each photo's date, pick an **existing album or create a new one** right there, and add an optional note.
- **Albums**
  - **My albums**: your own albums, each with a name, an icon and a theme. Edit or delete them any time.
  - **By month**: automatic albums for every month of the baby's age, based on the date each photo was taken.
- **Month themes**: every month has its own theme (defaults rotate through Super Hero, Safari, Anime, Dino, Baby Blue, Thunder Knight and Neo Tokyo). Change it on the month page or on the home page. Turn on **"Follow baby's month"** to make the whole site use the current month's theme.
- **Play story**: full-screen slideshow of any album or month. Tap left/right to move, hold to pause.
- **Story Studio**
  - **Story video**: makes a real video file (MP4 in Chrome/Edge, WebM elsewhere) with a title card, photos in cute cards, baby's age & date, Fade/Slide/Zoom transitions, a music-box "Twinkle Twinkle" track made in code, and Story (9:16), Square or Portrait format.
  - **Collage image**: puts all the chosen photos into one PNG. Layouts: Polaroids, Grid or Hero; three sizes; theme colours; stickers; and "Shuffle". You can download it, share it, or save it back into an album.
- **14 themes in 4 groups**, each with its own colours, display font, background pattern, card style and stickers (also used in videos & collages):
  - 🦸 **Super heroes**: Super Hero (red/blue/gold, comic halftone, *Bangers* font) · Thunder Knight (dark navy + lightning yellow)
  - 🦁 **Animals**: Safari Cub (lion orange + jungle green, animal-print spots, *Lilita One*) · Dino Roar (green dino scales)
  - 🍥 **Anime**: Anime Hero (manga speed lines, *Mochiy Pop One*) · Neo Tokyo (dark neon city grid)
  - 🍼 **Soft & sweet**: Baby Blue, Mint Cloud, Lemon Chick, Cocoa Bear, Peachy Sunshine, Lavender Dream, Strawberry Milk, Midnight Lullaby

  The hero and anime themes are original designs inspired by those styles. They use no trademarked logos or characters.
- **English / Tiếng Việt**: switch with the language button (sidebar on desktop, top bar on phones). The choice is remembered, and phones set to Vietnamese open in Vietnamese automatically. Ages, dates, starter album names, theme names and the text inside videos and collages are all translated. Titles switch to fonts that support Vietnamese letters.
- **Baby profile**: name, photo and birthday (used for all the age labels). Click the baby in the sidebar (or the top-right avatar on phones) to edit it.

## Devices

Tested on laptops (1280–1440px), iPad (mini, 10.2", Pro 11" in portrait and landscape), Android tablets, iPhone (SE, 15, 15 Pro Max) and Android phones (320–412px wide). Apple devices were tested in Playwright's WebKit, the same engine as Safari.

- **Phones:** top bar plus a floating bottom tab bar. Pop-ups open as bottom sheets.
- **Phones turned sideways** (landscape, under 500px tall): compact icon sidebar instead, so photos get the full height.
- **iPad portrait:** compact icon sidebar. **iPad landscape and laptops:** full sidebar.
- **iPhone notch, home bar and rounded corners:** content keeps clear of them (`env(safe-area-inset-*)`).
- **Text fields are at least 16px on touch screens,** so iPhones don't zoom in when one is tapped. Tap targets are enlarged for fingers, and hover effects only run on devices with a mouse.

## Tech

| | |
|---|---|
| UI | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 (themes are CSS variables under `[data-theme]`, so any section can have its own theme) |
| Routing | React Router |
| Animation | Motion (`motion/react`) |
| Video | Canvas + `MediaRecorder` + Web Audio (no server, no ffmpeg) |
| Storage | IndexedDB via `idb-keyval` (photos as Blobs), localStorage for albums, profile & themes |

## Where the data lives

Everything is stored **in the browser**. Nothing is uploaded to a server, so photos are private but only exist on that device/browser. Uploads are resized to at most 1600px.
To share with family across devices, add a backend (e.g. Supabase or Firebase). Photo storage is in `src/lib/db.ts` and albums are in `src/store/LibraryContext.tsx`.

Video recording runs in real time, so keep the tab open until it finishes.

## Project structure

```
src/
  pages/        Home (upload), Albums, AlbumPage (album + month), Studio
  components/   Layout, PhotoViewer, StoryViewer, ThemeModal, AlbumFormModal, studio/…
  store/        Library (photos + albums), Theme (month themes), Profile, UI contexts
  lib/          video.ts, collage.ts, music.ts, canvas.ts, months, themes, albums, db, seed
  i18n/         messages.ts (all English + Vietnamese text), index.tsx (language switch)
  index.css     Tailwind v4 + all theme palettes
```

To add a theme, add a `[data-theme="..."]` block in `src/index.css` and an entry in `src/lib/themes.ts`.

To add or change text, edit `src/i18n/messages.ts`. TypeScript reports an error if a Vietnamese translation is missing.
