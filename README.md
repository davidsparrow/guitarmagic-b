README


# 🎬 GuitarTube - the best guitar learning video platform in the galaxy, sorry Orion.

Transform your YouTube experience with custom video controls, flipping, and looping features.

## ✨ Features
- 🔄 Flip videos vertically & horizontally
- 🔁 Custom loop controls (Premium)
- 📱 Mobile-responsive design
- 🔐 User authentication & subscriptions

## 🚀 Quick Start
```bash
npm install
npm run dev
```

## 🔧 Mocking YouTube Search (Local Dev)

To run the app without a working YouTube API key or allowed referer, enable mock search results:

1. Create `.env.local` in the project root with:

```
NEXT_PUBLIC_USE_MOCK_SEARCH=true
```

2. Restart `npm run dev`.

When `NEXT_PUBLIC_USE_MOCK_SEARCH=true`, the search page returns fake results and still exercises daily search counting and gating. Set to `false` (or omit) to use the real YouTube API.