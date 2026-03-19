# Ecommerce Dashboard — Digital Products

Plateforme e-commerce pour la vente de produits digitaux, ciblant le marche africain (XOF/FCFA). Backend Laravel + Filament, frontend Next.js, stockage S3.

## Architecture

```
├── src/                  # Frontend — Next.js 16 (App Router)
├── server/               # Backend — Laravel 11 + Filament PHP 3
├── docker/               # Config Nginx, Supervisor, OPcache
├── Dockerfile.frontend   # Image Next.js standalone
├── Dockerfile.backend    # Image PHP-FPM + Nginx
├── Dockerfile.worker     # Image queue worker Redis
└── .github/workflows/    # CI/CD GitHub Actions
```

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Backend | Laravel 11, Filament PHP 3, PHP 8.3 |
| Base de donnees | PostgreSQL 16 |
| Queue / Cache | Redis (via predis) |
| Stockage fichiers | S3-compatible (Tigris, R2, AWS S3) |
| CI/CD | GitHub Actions → GHCR → Railway |

## Fonctionnalites

### Checkout
- 3 templates : Classic, Dark Premium, Minimalist Card
- Description riche (editeur WYSIWYG avec upload d'images S3)
- Features dynamiques avec position configurable
- FAQs avec accordeon
- Temoignages (3 styles : cards, minimal, highlight)
- Section video (YouTube/Vimeo) avec position configurable
- Sales popup (preuve sociale simulee)
- Logos de paiement africains et internationaux
- Timers d'urgence (countdown, places limitees, offre flash, viewers)
- Champ telephone avec selecteur de pays (75+ pays, drapeaux, indicatifs)
- Footer boutique avec disclaimer Meta, toggle FR/EN

### Tracking
- Facebook Pixel (PageView, ViewContent, InitiateCheckout, Purchase)
- Facebook Conversion API (cote serveur, via job queue Redis)
- TikTok Pixel (ViewContent, InitiateCheckout, CompletePayment)
- Deduplication via event_id entre Pixel et CAPI
- Configuration par boutique dans Filament

### Admin (Filament)
- Gestion boutiques, produits, commandes
- Configuration checkout (template, couleurs, CTA, urgence, tracking)
- Upload fichiers digitaux vers S3
- Rich text editor avec images embarquees

## Setup local

### Pre-requis
- PHP 8.3+ avec extensions : pdo_pgsql, mbstring, zip, intl, bcmath
- Composer 2
- Node.js 20+
- PostgreSQL 14+
- Redis (optionnel en local, requis en prod)

### Installation

```bash
# Frontend
npm install

# Backend
cd server
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan storage:link
```

### Lancement

```bash
# Terminal 1 — Backend
cd server && php artisan serve

# Terminal 2 — Frontend
npm run dev

# Terminal 3 — Queue worker (optionnel, pour les jobs CAPI)
cd server && php artisan queue:work
```

- Frontend : http://localhost:3000
- Backend API : http://localhost:8000/api
- Admin Filament : http://localhost:8000/admin

### Variables d'environnement

**Backend** (`server/.env`) :
```env
DB_CONNECTION=pgsql
DB_HOST=/var/run/postgresql   # ou 127.0.0.1 avec mot de passe
DB_DATABASE=ecommerce_dashboard
DB_USERNAME=merrick

QUEUE_CONNECTION=redis        # ou sync en local sans Redis
CACHE_STORE=redis             # ou file en local sans Redis
REDIS_CLIENT=predis

AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET=...
AWS_ENDPOINT=...
FILESYSTEM_DISK=s3

FRONTEND_URL=http://localhost:3000
```

**Frontend** (`.env`) :
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Deploiement (Railway)

### Services

| Service | Image GHCR | Port |
|---------|-----------|------|
| frontend | `ghcr.io/<repo>/frontend` | 3000 |
| backend | `ghcr.io/<repo>/backend` | 8000 |
| worker | `ghcr.io/<repo>/worker` | — |

### Addons Railway
- **PostgreSQL** → injecte `DATABASE_URL`
- **Redis** → injecte `REDIS_URL`

### Variables backend + worker
```env
APP_ENV=production
APP_KEY=base64:...
APP_DEBUG=false
APP_URL=https://backend.railway.app
DATABASE_URL=<auto Railway>
REDIS_URL=<auto Railway>
REDIS_CLIENT=predis
QUEUE_CONNECTION=redis
CACHE_STORE=redis
FILESYSTEM_DISK=s3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_BUCKET=...
AWS_ENDPOINT=...
AWS_URL=...
AWS_DEFAULT_REGION=auto
AWS_USE_PATH_STYLE_ENDPOINT=true
FRONTEND_URL=https://frontend.railway.app
```

### Variable frontend
```env
NEXT_PUBLIC_API_URL=https://backend.railway.app/api
```

### Secret GitHub Actions
- `NEXT_PUBLIC_API_URL` — URL du backend (pour le build Docker frontend)

### Premiere migration
```bash
railway run -s backend -- php artisan migrate --force
```

## CI/CD

- **PR vers main** → build + test (TypeScript check, Laravel migrations sur Postgres)
- **Push sur main** → build + test → build Docker images → push sur GHCR
- 3 images : frontend, backend, worker

## API

| Methode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/checkout/{slug}` | Donnees checkout (produit, config, tracking) |
| POST | `/api/v1/orders/create` | Creer une commande |
| GET | `/api/v1/orders/{id}` | Details commande + download URL |
| GET | `/api/v1/stores` | Liste des boutiques |
| GET | `/api/v1/download/{id}` | Telecharger un fichier |
| POST | `/api/v1/download/{id}/track` | Tracker un clic download |
