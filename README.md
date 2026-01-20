# Recipe App 🍳

A Progressive Web App (PWA) for browsing and saving recipes from TheMealDB. Built with React, Vite, Tailwind CSS, and shadcn/ui, with a Node.js/Express backend proxy.

![Recipe App](https://via.placeholder.com/800x400/ea580c/ffffff?text=Recipe+App)

## ✨ Features

- **🔍 Search & Browse**: Search recipes by name or browse by category
- **📱 PWA**: Installable app with offline support
- **❤️ Favorites**: Save recipes to access them offline (stored in IndexedDB)
- **🌙 Dark Mode**: System-aware theme with manual toggle
- **♿ Accessible**: Keyboard navigation, ARIA labels, semantic HTML
- **🚀 Fast**: Optimized caching strategies and skeleton loading states

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and builds
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **TanStack Query** for data fetching and caching
- **React Router** for navigation
- **idb** for IndexedDB wrapper

### Backend
- **Node.js** with Express
- **CORS**, **Helmet**, **Compression** for security and performance
- Environment-based configuration

### PWA Features
- Custom service worker (no Workbox)
- Offline fallback page
- App manifest for installation
- Runtime caching strategies

## 📁 Project Structure

```
recipe-app/
├── client/                    # React frontend
│   ├── public/
│   │   ├── icons/            # PWA icons (SVG)
│   │   ├── manifest.webmanifest
│   │   ├── offline.html      # Offline fallback page
│   │   └── sw.js             # Service worker
│   ├── src/
│   │   ├── components/       # UI components
│   │   │   ├── layout/       # Layout components (Header)
│   │   │   └── ui/           # shadcn/ui components
│   │   ├── features/
│   │   │   └── favorites/    # Favorites feature (IndexedDB)
│   │   ├── lib/              # Utilities (API, query client)
│   │   ├── pages/            # Page components
│   │   └── styles/           # Global styles
│   ├── package.json
│   ├── tailwind.config.cjs
│   └── vite.config.ts
├── server/                    # Express backend
│   ├── src/
│   │   ├── index.js          # Server entry point
│   │   └── routes/
│   │       └── mealdb.js     # API proxy routes
│   ├── .env.example
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd recipe-app
   ```

2. **Set up the server**
   ```bash
   cd server
   cp .env.example .env
   npm install
   npm run dev
   ```
   The server runs on `http://localhost:5174`

3. **Set up the client** (in a new terminal)
   ```bash
   cd client
   npm install
   npm run dev
   ```
   The client runs on `http://localhost:5173`

4. **Open the app**
   Navigate to `http://localhost:5173` in your browser

## ⚙️ Environment Variables

### Server (`server/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `MEALDB_API_KEY` | TheMealDB API key | `1` (test key) |
| `MEALDB_API_BASE` | TheMealDB API base URL | `https://www.themealdb.com/api/json/v1` |
| `PORT` | Server port | `5174` |
| `NODE_ENV` | Environment | `development` |
| `CLIENT_URL` | Client URL for CORS | - |

## 🎨 shadcn/ui Setup

The project already includes pre-configured shadcn/ui components. If you need to add more:

1. Make sure you're in the client directory:
   ```bash
   cd client
   ```

2. Run the shadcn CLI (if not already initialized):
   ```bash
   npx shadcn-ui@latest init
   ```

3. Add components as needed:
   ```bash
   npx shadcn-ui@latest add button card input badge dialog skeleton toast
   ```

### Included Components
- Button, Card, Input, Badge
- Dialog, Skeleton, Toast
- Theme Provider & Toggle

## 📱 PWA Features

### Service Worker Caching Strategies

| Resource Type | Strategy | Description |
|---------------|----------|-------------|
| Static assets | Cache First | JS, CSS, images from app |
| API requests | Network First | Falls back to cache when offline |
| Images (MealDB) | Stale While Revalidate | Shows cached, updates in background |
| Navigation | Network First + Offline Fallback | Shows cached page or offline.html |

### Testing PWA Features

1. **Install the app**:
   - Chrome: Click the install icon in the address bar
   - Edge: Click "App available" in the address bar

2. **Test offline mode**:
   - Open DevTools → Network → Check "Offline"
   - Previously viewed recipes should still load
   - Favorites are fully functional offline

3. **Update the service worker**:
   - Modify `CACHE_VERSION` in `public/sw.js`
   - Reload the page to activate the new version

### Changing Caching Strategies

Edit `client/public/sw.js` to modify caching behavior:

```javascript
// Increase cache size limits
const MAX_DYNAMIC_CACHE_SIZE = 100; // Default: 50
const MAX_IMAGE_CACHE_SIZE = 200;   // Default: 100

// Change cache TTL
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes
```

## 🔌 API Endpoints

All requests go through the Express proxy at `/api/*`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/search?s={query}` | GET | Search meals by name |
| `/api/meal/:id` | GET | Get meal details by ID |
| `/api/categories` | GET | List all categories |
| `/api/filter?c={category}` | GET | Filter meals by category |
| `/api/random` | GET | Get a random meal |

## 🏗️ Build & Deploy

### Build the Client

```bash
cd client
npm run build
```

Output will be in `client/dist/`

### Deploy Suggestions

- **Backend**: [Render](https://render.com), [Railway](https://railway.app), [Fly.io](https://fly.io)
- **Frontend**: [Vercel](https://vercel.com), [Netlify](https://netlify.com), [Cloudflare Pages](https://pages.cloudflare.com)

### Production Notes

1. Set `NODE_ENV=production` on the server
2. Update CORS origins in `server/src/index.js`
3. Consider using a CDN for static assets
4. Replace placeholder icons with real ones

## ✅ Post-Generation Checklist

- [ ] Replace placeholder icons in `client/public/icons/` with real app icons
- [ ] Update `theme_color` in manifest if needed
- [ ] Add real screenshots to manifest for app stores
- [ ] Configure production CORS origins
- [ ] Set up environment variables in production
- [ ] Test offline functionality
- [ ] Run Lighthouse audit for PWA compliance

## 📄 License

MIT

## 🙏 Credits

- Recipe data from [TheMealDB](https://www.themealdb.com/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
