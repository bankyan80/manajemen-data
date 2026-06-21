# Aplikasi Laporan Pendidikan Kecamatan

Sistem informasi manajemen laporan pendidikan tingkat kecamatan yang memfasilitasi pengelolaan data sekolah, pegawai, dokumen, dan laporan bulanan.

## Fitur

- **Manajemen Sekolah** — Kelola data sekolah SD dan PAUD se-kecamatan
- **Manajemen Pegawai** — Data kepegawaian lengkap dengan riwayat dan dokumen
- **Dokumen Pegawai** — Upload, verifikasi, dan tracking kelengkapan dokumen via Google Drive
- **Rekap Siswa** — Data jumlah siswa per kelas/kelompok setiap semester
- **Laporan Bulanan** — Pembuatan dan pengiriman laporan berkala dari sekolah ke kecamatan
- **Dashboard** — Visualisasi data dengan grafik interaktif (Recharts)
- **Role-based Access** — Admin Kecamatan, Operator Sekolah, dan Pegawai
- **Ekspor Data** — PDF dan Excel (xlsx)

## Tech Stack

| Kategori        | Teknologi                                                   |
| --------------- | ----------------------------------------------------------- |
| Framework       | [Next.js](https://nextjs.org) 16 (App Router)               |
| Database        | [Turso](https://turso.tech) (libSQL)                        |
| ORM             | [Drizzle ORM](https://orm.drizzle.team)                     |
| Auth            | [NextAuth.js](https://next-auth.js.org) v4 + Credentials (username/password) |
| Storage         | Google Drive API (Service Account)                          |
| Spreadsheet     | Google Sheets API + [xlsx](https://sheetjs.com)             |
| Charts          | [Recharts](https://recharts.org)                            |
| PDF             | [jsPDF](https://github.com/parallax/jsPDF) + autotable     |
| Forms           | react-hook-form + Zod                                       |
| Styling         | Tailwind CSS v4                                             |
| Deployment      | Vercel                                                      |

## Getting Started

### Prerequisites

- Node.js 20+
- npm
- Turso database (or local libSQL instance)
- Google Cloud project with Drive, Sheets, and OAuth APIs enabled

### Installation

```bash
git clone <repo-url>
cd aplikasi-laporan-pendidikan
npm install
```

### Environment Variables

Salin `.env.example` ke `.env` dan isi variabel yang diperlukan:

```bash
cp .env.example .env
```

### Akun Demo (setelah seed)

| Role | Username | Password |
|------|----------|----------|
| Admin Kecamatan | `admin_Tim` | `admin456` |
| Operator SDN 1 Sukamaju | `20210001` | `sp20210001` |
| Operator SDN 2 Sukamaju | `20210002` | `sp20210002` |
| Operator SDN 3 Sukamaju | `20210003` | `sp20210003` |
| Operator SDN 4 Sukamaju | `20210004` | `sp20210004` |
| Operator PAUD Melati | `20220001` | `sp20220001` |
| Operator TK Harapan Bunda | `20220002` | `sp20220002` |
| Operator KB Cerdas Ceria | `20220003` | `sp20220003` |
| Pegawai (Dedi Kurniawan) | `198001012005011001` | `011001` |
| Pegawai (Siti Nurhayati) | `198502102010012002` | `012002` |
| Pegawai (Agus Setiawan) | `198703152011011003` | `011003` |
| Pegawai (Bambang Supriyadi) | `198205052005012002` | `012002` |

### Database Setup

```bash
# Generate migration files
npm run db:generate

# Apply migrations
npm run db:migrate

# Seed sample data
npm run db:seed
```

### Development

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Environment Variables

| Variable                       | Deskripsi                              |
| ------------------------------ | -------------------------------------- |
| `TURSO_DATABASE_URL`           | URL database Turso/libSQL              |
| `TURSO_AUTH_TOKEN`             | Token autentikasi Turso                |
| `GOOGLE_DRIVE_CLIENT_EMAIL`    | Service account email untuk Drive      |
| `GOOGLE_DRIVE_PRIVATE_KEY`     | Private key service account Drive      |
| `GOOGLE_DRIVE_ROOT_FOLDER_ID`  | ID folder root di Google Drive         |
| `GOOGLE_SHEETS_CLIENT_EMAIL`   | Service account email untuk Sheets     |
| `GOOGLE_SHEETS_PRIVATE_KEY`    | Private key service account Sheets     |
| `GOOGLE_SPREADSHEET_ID`        | ID spreadsheet untuk ekspor data       |
| `NEXTAUTH_URL`                 | URL aplikasi (http://localhost:3000)   |
| `NEXTAUTH_SECRET`              | Secret key untuk NextAuth              |

## Deployment ke Vercel

1. Push repository ke GitHub
2. Import project di [Vercel](https://vercel.com/new)
3. Set environment variables di Vercel Dashboard
4. Deploy

## GitHub Workflow

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run lint
      - run: npm run build
```
