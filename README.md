# Digital Products Dashboard

A full-stack application built with Next.js (App Router), TypeScript, Tailwind CSS, Shadcn/UI, and Prisma.

## Features
- **Dashboard Overview:** Monitor revenue, products, and stores.
- **Product Management:** Add and manage your digital products safely.
- **Store Management:** Create independent storefronts.
- **Assign Products:** Easily select which digital product is sold on which store.

## Tech Stack
- **Framework:** Next.js (React)
- **Database:** SQLite (dev) via Prisma ORM (Easily switchable to PostgreSQL)
- **Styling:** Tailwind CSS + Shadcn UI components
- **Language:** TypeScript

## Setup Instructions
1. Install dependencies: \`npm install\`
2. Generate Prisma Client and DB: \`npx prisma db push\`
3. Run the development server: \`npm run dev\`
4. Open [http://localhost:3000](http://localhost:3000)

## Security
Currently, files require a simple URL string. In a production environment, this application should be extended with:
- AWS S3 or Cloudflare R2 for file hosting.
- Signed, expiring URLs for file downloads.
- Authentication (e.g. NextAuth.js or Clerk).
