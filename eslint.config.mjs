import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Legacy code (being deprecated by rebuild)
    "_legacy/**",
    "scripts/**",
    "db/check-data.ts",
    "db/check-nik*.ts",
    "db/fix-duplicates*.ts",
    "db/migrate-*.ts",
    "db/seed.ts",
    "db/sync-*.ts",
    "db/verify-sync.ts",
    "db/clean-duplicates.ts",
    "app/login/**",
    "app/dashboard/**",
    "app/kesiswaan/**",
    "app/gtk/**",
    "app/spmb/**",
    "app/sarpras/**",
    "app/pengaturan/**",
    "app/rekap-kecamatan/**",
    "app/arsip-digital/**",
    "app/arsip-dokumen/**",
    "app/monitoring/**",
    "app/kurikulum/**",
    "app/kelembagaan/**",
    "app/kegiatan-prestasi/**",
    "app/transisi-sd-smp/**",
    "app/cetak-export/**",
    "app/sd/**",
    "app/tk-kb/**",
    "app/api/**",
    "components/layout/**",
    "components/forms/**",
    "components/tables/**",
    "components/kesiswaan/**",
    "components/charts/**",
    "components/dashboard/**",
    "types/index.ts",
    "lib/auth.ts",
    "lib/permissions.ts",
    "lib/useData.ts",
    "lib/usePermissions.ts",
    "lib/export-excel.ts",
    "lib/export-pdf.ts",
    "lib/drive.ts",
    "lib/sheets.ts",
  ]),
]);

export default eslintConfig;
