<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Goal
- Develop a sub-district education management information system (Manajemen Satu Data) for managing schools, employees, documents, student data, monthly reports, and SPMB/PPDB registration.

## Constraints & Preferences
- Next.js 16.2.9 (App Router, Turbopack), Turso/libSQL (Drizzle ORM), NextAuth v4, Tailwind CSS v4, Recharts
- Deployed on Vercel at `timker-bidik.online` (project: `satu-data`, org: `yanuarhidayat80-6265s-projects`)
- Git repo: `github.com/bankyan80/manajemen-data` (branch: `master`)
- Vercel Blob Storage for file uploads
- Navigation menu: `bg-primary` (`#1e3a8a`) with white text
- SPMB page: horizontal submenu tabs (no sidebar), role-based views per user role

## Progress
### Done
- Rebuilt `app/spmb/page.tsx` with full role-based SPMB system (admin: 5 tabs, operator: 3 tabs)
- Created DB tables `spmb_daya_tampung` and `spmb_pendaftar` in `db/schema.ts` and pushed to Turso via `drizzle-kit push`
- Created API routes:
  - `app/api/spmb/daya-tampung/route.ts` — CRUD + auto compute total/terisi/sisa
  - `app/api/spmb/pendaftar/route.ts` — list/search/create (auto no_pendaftaran + usia)
  - `app/api/spmb/pendaftar/[id]/route.ts` — detail, update, delete
  - `app/api/spmb/berkas/route.ts` — file upload to Vercel Blob
  - `app/api/spmb/rekap/route.ts` — rekap jalur, usia (group chart), monitoring kuota
  - `app/api/spmb/export/route.ts` — Excel & PDF export for all data types
  - `app/api/settings/route.ts` — GET all, PUT key/value (upsert) for role_permissions
- Linked Vercel Blob store `manajemen-data` to project via REST API
- Pulled `BLOB_READ_WRITE_TOKEN` to `.env.local` — verified present for local dev
- Updated `.gitignore` to exclude `.env*.local`
- Fixed `lib/useData.ts` — supports `null` key (skip fetch)
- Made "Edit Izin" on Pengaturan → Role & Hak Akses functional with toggle modal (11 features × 3 roles), saves JSON to `settings` table
- Built and deployed — all API routes live

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- SPMB data stored in new dedicated tables (`spmb_daya_tampung`, `spmb_pendaftar`) instead of reusing old `ppdb` table (aggregate-only, incompatible schema)
- Document URLs stored inline in `spmb_pendaftar` (file_kk_url, file_akta_url, etc.) rather than separate berkas table — simpler queries, fewer joins
- SPMB page is a single `.tsx` file (~900 lines) with state-driven tabs, not separate route pages — follows existing GTK pattern
- Bar chart for Rekap Usia uses pure CSS (flex heights) instead of recharts — lighter, sufficient for this view
- Role permissions stored as JSON in `settings` table under `role_permissions` key

## Next Steps
- Seed initial `spmb_daya_tampung` data for existing schools
- Test SPMB upload API on production end-to-end

## Critical Context
- `BLOB_READ_WRITE_TOKEN="vercel_blob_rw_JKHFiOYgL9C4cbdy_8d0gwhvzNt6ZrzPiVEjAGTt5vF58jZ"` set in all Vercel environments + local `.env.local`
- SPMB store `manajemen-data` (store_JKHFiOYgL9C4cbdy) — public access, iad1 region

## Relevant Files
- `app/spmb/page.tsx`: Full SPMB page (admin + operator), all table/modals/forms inline
- `app/api/spmb/*/route.ts`: 6 API route files for SPMB CRUD, rekap, upload, export
- `db/schema.ts`: Added `spmbDayaTampung` and `spmbPendaftar` tables
- `lib/useData.ts`: Updated to accept `string | null` key (skip fetch when null)
- `app/pengaturan/page.tsx`: Settings page — Roles & Permissions tab with Edit Izin modal
- `app/api/settings/route.ts`: GET all settings, PUT key/value with upsert
