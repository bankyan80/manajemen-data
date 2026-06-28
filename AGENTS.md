<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Goal
- Maintain and secure the aplikasi laporan pendidikan for Kecamatan Lemahabang, fix critical security vulnerabilities, continue feature development.

## Constraints & Preferences
- Domain `timker-bidik.online` from Hostinger, deployed on Vercel
- Vercel Blob (`BLOB_READ_WRITE_TOKEN`) dipakai via REST API
- `role_permissions` dari Pengaturan → Role & Hak Akses harus mengontrol navigasi
- Dashboard-stats hanya hitung siswa tahun pelajaran berjalan — berbeda per jenjang: SD `2026/2027`, TK/KB `2025/2026`
- Permission guard di halaman ditarik karena error #310; cukup di navigasi saja
- Operator sekolah hanya lihat data sekolah sendiri — tidak semua sekolah
- Data pegawai swasta diimpor dari file Excel Dapodik di `C:\Users\Bank Yan\portal-dinas\data-pegawai\`
- Form siswa SD vs TK/KB dibedakan: NISN hanya untuk SD, NIK autofill untuk semua jenjang
- Dropdown kelas cocok dengan nilai di DB: SD pakai `'Kelas I'–'Kelas VI'`, KB pakai usia
- SPMB page harus jadi server component untuk hindari konflik hook `useSession`

## Progress
### Done
- Domain added to Vercel project; A record `76.76.21.21` + CNAME `www` → `cname.vercel-dns.com`
- `NEXTAUTH_URL` updated to `https://timker-bidik.online` in `.env`, `.env.example`, `AGENTS.md`, `README.md`
- Added `APP_URL` and `DB_HOST` to `.env`
- Created `.env.hostinger` with all production env vars for Hostinger deployment
- NIK autofill: `/api/kesiswaan/students/lookup-nik/route.ts` searches `spmb_pendaftar` then `students` — enabled for **all jenjang** (not only SD)
- Login page title changed to "Sistem Terpadu Laporan Pendidikan Dasar Tingkat Kecamatan Lemahabang"
- Logo frame removed from login page and topbar
- Apple touch icon added in metadata
- `lib/usePermissions.ts`: `usePermissions()` hook, dipanggil di navigasi saja
- `TopNavigation.tsx` & `MobileTopNavigation.tsx`: filter nav items by role_permissions
- Page-level `usePageGuard` removed from 13 pages due to React error #310
- **Import pegawai swasta**: 144 pegawai dari 22 sekolah swasta via `scripts/import-pegawai-swasta.ts` dari Excel Dapodik
- **KB kelas_kelompok fix**: update dari "Kelompok Bermain A/B" ke "2–3/3–4/4–5 Tahun" berdasarkan usia
- **Auto-nonaktifkan TK/KB saat SD ditambahkan**: POST `/api/kesiswaan/students` otomatis set `status_siswa = 'pindah'` untuk siswa TK/KB dengan NIK yang sama
- **Perbedaan form SD vs TK/KB**: NISN disembunyikan untuk TK/KB di form Add/Edit, Detail, Mutasi Masuk & Keluar
- **Fix KELAS_OPTIONS SD**: dari `['1'..'6']` → `['Kelas I'..'Kelas VI']` agar cocok DB
- **Fix KELAS_KB rekap**: dari `['Kelompok A', 'B']` → `['2–3 Tahun', '3–4 Tahun', '4–5 Tahun']` (sesuai DB)
- **React error #310 fix**: SPMB page di-split — `page.tsx` server component (pakai `auth()` server-side), client code pindah ke `_client.tsx`
- **NIK field di mutasi**: tambah kolom `nik` ke `student_mutations` + `drizzle-kit push`; update API mutasi & frontend
- **Full audit**: `AUDIT_REPORT.md` — 37+ findings, score **38/100**
- **Security middleware**: `proxy.ts` (Next.js 16 proxy convention) — `getToken` JWT check on ALL `/api/*` except `/api/auth/*`; 401 if no valid token
- **CORS fix**: `Access-Control-Allow-Origin: https://timker-bidik.online` (was `*`) via `next.config.ts` + middleware
- **Security headers**: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` via middleware
- **`requireApiAuth()` helper** di `lib/auth.ts`
- **43 DB indexes** across 20 tables — via `drizzle-kit push` + fallback `scripts/add-indexes.ts`
- **Rekap Kecamatan**: per-jenjang tahun pelajaran (SD=2026/2027, TK/KB=2025/2026); summary cards terpisah per jenjang; API dukung params `tahun_pelajaran_sd/tk/kb`
- **Database revert**: 1.265 siswa TK/KB dikembalikan ke TP `2025/2026` via `scripts/revert-tk-kb-tp.ts`
- **Operator school_id filter**: API students, mutasi-masuk, mutasi-keluar auto-filter by `sekolah_id` session untuk operator; admin tetap lihat semua
- **Kesiswaan page**: `jenjang` type `''` dihapus, default `'sd'`; operator auto-detect school jenjang via `/api/schools/:id`; "Semua" tab dihapus kembali
- All changes pushed to `master` and deployed to Vercel production

### In Progress
- (none)

### Blocked
- (none)

## Key Decisions
- Domain dipasang di Vercel (bukan Hostinger langsung) — lebih praktis, Vercel Blob tetap bisa dipakai
- `role_permissions` cukup di navigasi saja (tidak di tiap halaman) karena hook guard error #310
- Dashboard-stats & rekap filter TP berbeda per jenjang: SD `2026/2027`, TK/KB `2025/2026`
- Operator sekolah hanya lihat data sekolah sendiri — kesiswaan page auto-detect operator's school jenjang
- KB kelas_kelompok pakai label usia (`2–3 Tahun`, `3–4 Tahun`, `4–5 Tahun`) bukan "Kelompok Bermain A/B"
- NISN field hanya untuk SD; TK/KB tidak pakai NISN
- SPMB page di-split server/client untuk hindari error #310
- Middleware (proxy) dipakai untuk auth API routes — Next.js 16 renaming dari middleware.ts ke proxy.ts
- `nik` ditambah ke `student_mutations` agar mutasi TK/KB bisa dilacak (karena tidak punya NISN)
- Kesiswaan page default `jenjang='sd'` bukan `''` — operator auto-detect jenjang sekolah masing-masing

## Next Steps
- Error boundaries (`error.tsx`) dan loading states (`loading.tsx`) untuk semua page
- Pagination di API endpoint yang belum punya
- Database transactions untuk multi-step writes
- Import data pegawai KB PERMATA BUNDA jika ada file Excel

## Critical Context
- **Security middleware active**: ALL `/api/*` routes (except `/api/auth/*`) return 401 via `proxy.ts` JWT check — verified on production
- **CORS fixed**: origin restricted to `https://timker-bidik.online` (was wildcard `*`)
- **Security headers active**: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy — verified on production
- **Total peserta didik per TP**: 9.618 SD (2026/2027), 701 TK + 564 KB (2025/2026) = 10.883 total
- **DB indexes applied**: 43 indexes across 20 tables (via `drizzle-kit push` + `scripts/add-indexes.ts`)
- `lookup-nik` API menerima parameter `jenjang` tapi tidak menggunakannya — mencari di semua jenjang
- Pegawai: 426 GTK + 144 swasta = 570 total (KB PERMATA BUNDA belum ada data)
- Audit report lengkap di `AUDIT_REPORT.md` — overall score **38/100**
- **Operator hanya lihat data sekolah sendiri**: API students, mutasi-masuk, mutasi-keluar auto-filter by `user.sekolah_id` dari session
- **Kesiswaan page auto-detect operator jenjang**: fetch `/api/schools/:id` saat mount, set `jenjang` default sesuai data sekolah

## Relevant Files
- `proxy.ts`: Next.js 16 proxy middleware — JWT check + security headers + CORS (active on production)
- `next.config.ts`: CORS headers (`Access-Control-Allow-Origin: https://timker-bidik.online`)
- `lib/auth.ts`: `requireApiAuth()` helper
- `db/schema.ts`: + 43 index definitions across 20 tables
- `scripts/add-indexes.ts`: Fallback script for manual index creation
- `scripts/revert-tk-kb-tp.ts`: revert 1.265 TK/KB students from 2026/2027 → 2025/2026
- `app/api/rekap-peserta-didik/route.ts`: Supports per-jenjang tahun_pelajaran_sd/tk/kb params
- `app/rekap-kecamatan/page.tsx`: Per-jenjang summary cards + default filter per jenjang
- `app/api/dashboard-stats/route.ts`: + `totalStudentsSd`, `totalStudentsTk`, `totalStudentsKb` fields
- `app/api/kesiswaan/students/route.ts`: GET — operator filter sekolah_id via session; POST — auto-nonaktifkan TK/KB
- `app/api/kesiswaan/mutasi-masuk/route.ts` & `mutasi-keluar/route.ts`: GET — operator filter sekolah_id via session
- `app/kesiswaan/page.tsx`: Default jenjang `'sd'`; auto-detect operator school jenjang; No "Semua" tab; NISN hanya untuk SD
- `AUDIT_REPORT.md`: Full audit report (38/100 score, 37+ findings)
