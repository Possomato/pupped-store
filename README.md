# PUPPED

A single-catalog ecommerce site for selling exclusive sneakers. Built with Next.js, Neon Postgres, and Cloudflare R2.

## Features

- Public catalog with product browsing and size filtering
- Product detail pages with image galleries
- Contact form (Instagram/WhatsApp) with email notifications
- Admin area for product management (CRUD)
- Image upload to Cloudflare R2
- Responsive Apple-like design
- Rate-limited admin authentication

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Neon Postgres with Drizzle ORM
- **Storage**: Cloudflare R2 (S3-compatible)
- **Email**: Nodemailer (SMTP)
- **Auth**: Iron Session
- **Styling**: Tailwind CSS
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 18+
- Neon Postgres database
- Cloudflare R2 bucket
- SMTP server for email notifications

### Installation

1. Clone the repository

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment example file:
   ```bash
   cp .env.example .env.local
   ```

4. Configure your environment variables (see below)

5. Push the database schema:
   ```bash
   npm run db:push
   ```

6. Run the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon Postgres connection string |
| `ADMIN_PASSWORD` | Password for admin access |
| `SESSION_SECRET` | 32+ character secret for sessions |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 access key |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 secret key |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_ENDPOINT` | R2 endpoint URL |
| `R2_PUBLIC_URL` | Public URL for R2 bucket |
| `NEXT_PUBLIC_R2_PUBLIC_URL` | Same as R2_PUBLIC_URL (for client) |

### Email (Optional but recommended)

| Variable | Description |
|----------|-------------|
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP port (usually 587 or 465) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASSWORD` | SMTP password |
| `OWNER_EMAIL` | Email to receive notifications |

## Database Commands

```bash
# Generate migration files
npm run db:generate

# Run migrations
npm run db:migrate

# Push schema directly (development)
npm run db:push

# Open Drizzle Studio
npm run db:studio
```

## Project Structure

```
src/
├── app/
│   ├── admin/           # Admin pages
│   ├── api/             # API routes
│   ├── product/         # Product detail pages
│   └── page.tsx         # Home/catalog page
├── components/
│   ├── admin/           # Admin components
│   ├── catalog/         # Public catalog components
│   └── ui/              # Shared UI components
└── lib/
    ├── auth/            # Authentication utilities
    ├── db/              # Database schema and connection
    ├── email/           # Email sending utilities
    └── r2/              # R2 storage utilities
```

## Deployment

### Vercel

1. Connect your repository to Vercel
2. Add all environment variables in Vercel dashboard
3. Deploy

The database schema will be pushed automatically on first build if using `db:push` in the build command, or run migrations manually.

## Admin Access

Navigate to `/admin` and enter the password configured in `ADMIN_PASSWORD`.

Features:
- Dashboard with stats
- Product management (create, edit, delete)
- Image uploads
- Contact submission management

## Security

- Admin password stored in environment variable (not in database)
- Rate limiting on login attempts (5 attempts per 15 minutes per IP)
- Session-based authentication with HTTP-only cookies
- Input validation with Zod on all API routes
- Image validation (type and size limits)

## License

Private
