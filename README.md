## WordPress News Explorer 📰

A modern Next.js app that fetches the latest posts from the official WordPress.org News feed and lets you organize them across four columns with smooth drag‑and‑drop.

- Video walkthrough: ▶️ https://wp-4col.vercel.app/introduction.mp4

### ✨ Features
- Four‑column layout with drag‑and‑drop (dnd‑kit)
- Live data from WordPress.org REST API (`/wp-json/wp/v2/posts?_embed`)
- Responsive, image‑rich cards with publication dates
- Fast client caching and refetch using SWR
- Server route with revalidation for stable fetching
- Built with Next.js 15, React 19, Tailwind CSS v4, and TypeScript

### 🧭 How It Works
- API route: `src/app/api/posts/route.ts` fetches from WordPress and returns JSON with a 5‑minute revalidate window.
- UI: `src/app/page.tsx` uses SWR to call `/api/posts`, shows posts in four columns, and enables drag‑and‑drop with dnd‑kit.
- Media: Featured images are read from the embedded media in each post when available.

### 🚀 Getting Started
Requirements: Node 18+ and a package manager (pnpm recommended).

```bash
# Install deps
pnpm install

# Start dev server
pnpm dev

# Open the app
open http://localhost:3000
```

### 🧩 Tech Stack
- Next.js 15 (App Router)
- React 19
- TypeScript
- SWR
- dnd‑kit
- Tailwind CSS v4

### 📁 Project Structure
- `src/app/page.tsx` — Main page, SWR data fetching, DnD UI
- `src/app/api/posts/route.ts` — Server route proxying WordPress News API
- `src/components/ui/card.tsx` — UI Card primitives
- `src/lib/utils.ts` — Utility helpers
- `public/` — Static assets (including `introduction.mp4`)

### 📝 Notes
- The app fetches from the public WordPress.org News API and requires no API keys.
- Drag cards between or within columns; click a card to read the full post on wordpress.org.

### ☁️ Deploy
- Ideal target: Vercel. Push your repo and import it on Vercel — defaults work out of the box for Next.js 15.

Enjoy exploring WordPress news in a clean, draggable layout! 🎯
