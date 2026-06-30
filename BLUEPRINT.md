# TIMKER BIDIK 360 — REBUILD BLUEPRINT (v2)

## Architecture: Feature-First Modular

```
src/
├── app/               # Next.js App Router pages
├── components/        # Shared UI components
│   ├── ui/           # shadcn/ui-style primitives
│   ├── layout/       # Shell, Sidebar, Topbar
│   └── shared/       # Reusable business components
├── modules/          # Feature modules (isolated)
│   ├── dashboard/
│   ├── gis/
│   ├── schools/
│   ├── teachers/
│   ├── certification/
│   ├── archives/
│   ├── infrastructure/
│   ├── analytics/
│   ├── ai/
│   ├── simulation/
│   └── reports/
├── services/         # Service layer (business logic)
├── stores/           # Zustand stores
├── hooks/            # Shared hooks
├── db/               # Schema + migrations (preserved)
├── lib/              # Auth, db client, utils
├── types/            # Shared types
├── constants/        # App constants
├── utils/            # Pure utility functions
└── config/           # App configuration
```

## Database Plan

### Tables to ADD (new schema in db/schema.ts)
- `villages` — master desa/kelurahan
- `subjects` — mata pelajaran
- `classes` — rombel
- `certifications` — sertifikasi guru
- `teacher_mutations` — mutasi guru
- `alerts` — system alerts
- `audit_logs` — audit trail

### Tables to KEEP (existing, with enhancements)
- `users` — + Google OAuth fields
- `schools` — + village_id FK, health_score fields
- `employees` — + certification tracking fields
- `students` — UNIQUE on nik, nisn; CASCADE deletes
- `infrastructure` (tanah, bangunan, ruang, sarana, buku)
- `activity_logs`
- `notifications`
- `settings`

### Key Enhancements
- Add CASCADE deletes to ALL foreign keys
- Add UNIQUE constraints (employees.nik, students.nik, students.nisn)
- Add indexes for all FK columns
- Add ON DELETE CASCADE for cleanup safety

## Auth System (Simplified — 2 Roles)

### Role 1: Admin Kecamatan
- View ALL schools
- Analytics, GIS, Reports, Archive
- AI recommendations, Simulations

### Role 2: Guru/Tendik
- Personal dashboard
- Certification tracking
- Upload personal documents
- Notifications & profile

## Module Roadmap (Priority Order)

| Priority | Module | Dependencies | Effort |
|----------|--------|-------------|--------|
| P0 | Executive Dashboard | DB schema, KPI service | 2d |
| P0 | API Security (auth guard) | Auth lib | 1d |
| P1 | School Digital Twin | Schools, Students, Teachers | 3d |
| P1 | Teacher Analytics | Employees, Certifications | 3d |
| P2 | GIS Education Map | Schools (lat/lng), Leaflet | 3d |
| P2 | Certification Monitoring | Certifications table | 2d |
| P2 | Infrastructure Audit | Sarpras tables | 2d |
| P2 | Digital Archive | Documents table | 2d |
| P3 | AI Intelligence | All services | 3d |
| P3 | Simulation Engine | Teachers, Students | 3d |
| P3 | Report Center | All services | 2d |

## Migration Strategy

1. Keep Turso database AS-IS (data preserved)
2. Run migration scripts for NEW tables only
3. New code reads from same schema + new tables
4. Zero-downtime approach — old code works until new routes active

## UI Design System

### Theme Variables
```
Primary Blue:    #2563EB
Secondary Indigo: #4F46E5
Success Green:   #10B981
Warning Yellow:  #F59E0B
Danger Red:      #EF4444
Purple:          #8B5CF6
Background:      #F1F5F9
Surface:         #FFFFFF
Text Primary:    #0F172A
Text Secondary:  #64748B
Border:          #E2E8F0
```

### Design Tokens
- Cards: rounded-xl (12px), subtle shadow
- Buttons: rounded-lg (8px), font-semibold
- Inputs: rounded-lg, border-2 on focus
- Transitions: 150ms ease
- Spacing: 4px base unit
- Typography: Inter (body), Poppins (headings)
