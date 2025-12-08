# ShopEverywhere

A location-based shopping platform that helps you find the best prices for products at stores near you.

## Getting Started

### 1. Environment Variables

Create a `.env` in the project root. The app constructs `DATABASE_URL` automatically, so you only need the individual pieces:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=$Baseball99
DB_NAME=shopeverywhere

# NextAuth
NEXTAUTH_SECRET="supersecretkey"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
APP_URL="http://localhost:3000"

# Email (SMTP)
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="smtp-user"
SMTP_PASS="smtp-password"
EMAIL_FROM="ShopEverywhere <no-reply@shopeverywhere.com>"
EMAIL_DISABLE_DELIVERY=false

# Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-key"

# Optional OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
FACEBOOK_CLIENT_ID=""
FACEBOOK_CLIENT_SECRET=""
```

> Set `EMAIL_DISABLE_DELIVERY=true` during local dev to log emails without sending or storing them.

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Schema & Seed

```bash
npx prisma migrate dev --name init
npm run prisma:seed
```

If you prefer to push without migrations, you can still export `DATABASE_URL` manually, but the recommended workflow is `prisma migrate dev`.

### 4. Run Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Admin Console

- Admin-only pages live under `/admin`. The middleware blocks non-admin sessions.
- Use the shopper navbar “shield” icon (visible to admins) to jump into `/admin/zones`.
- To promote yourself, set `isAdmin=true` on your user row in the database.

- **Zones**: Draw/edit polygons on a Google Map, assign stores via right-click or table actions, and view users affected by that zone. Saving re-syncs carts/users and removes products from carts that no longer belong in the zone.
- **Stores**: Full CRUD with multilingual name/description fields, address & coordinates, and a per-category accordion to add/edit/delete store products (image upload placeholder wired for DigitalOcean Spaces via `DO_SPACES_*` env vars).
- **Categories**: Tree editor with multilingual names; add/remove nodes and edit translations. Shopper UI automatically picks the right language.
- **Users / Products**: Placeholder entry points exist; product management currently lives inside the store detail page.

## Features

- **Location-based Shopping:** Finds stores within 10km of your location.
- **Price Comparison:** Shows the lowest price for a product across nearby stores.
- **Product Search:** Filter by name or category (now fully localized).
- **Shopping Cart:** Guest cart support, server-side cart sync, and automatic cleanup when zone or store availability changes.
- **User Accounts:** Register/login with email/password (OAuth ready). Email verification required before login.
- **Orders:** View past order history.
- **Admin tooling:** Zones map editor, category tree management, placeholder pages for stores/users/products.

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Prisma (ORM)
- MySQL
- NextAuth.js
- Google Maps API
- Nodemailer
