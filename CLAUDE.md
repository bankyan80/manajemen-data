# Aplikasi Laporan Pendidikan Kecamatan

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Database:** Turso (libSQL) via Drizzle ORM
- **Auth:** NextAuth.js v4 with Credentials (username/password)
- **Storage:** Google Drive API (Service Account)
- **Charts:** Recharts
- **PDF:** jsPDF + jspdf-autotable
- **Spreadsheets:** Google Sheets API + xlsx
- **Forms:** react-hook-form + Zod
- **Styling:** Tailwind CSS v4

## Architecture
- `/app` — Next.js App Router pages and API routes
- `/components` — Shared React components
- `/db` — Drizzle schema and migrations
- `/lib` — Utilities, db client, api helpers
- `/types` — TypeScript type definitions
- `/hooks` — Custom React hooks

## Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
```

## Conventions
- Use `cn()` utility from `clsx`/`tailwind-merge` for className merging
- Server Components by default; client components only when needed
- Use `crypto.randomUUID()` for ID generation
- All dates stored as Unix timestamps (milliseconds)
- Import db client from `@/lib/db`
