CREATE TABLE `activity_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`table_name` text NOT NULL,
	`record_id` text,
	`description` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `employee_documents` (
	`id` text PRIMARY KEY NOT NULL,
	`employee_id` text NOT NULL,
	`school_id` text NOT NULL,
	`kategori` text NOT NULL,
	`jenis_dokumen` text NOT NULL,
	`nama_file` text NOT NULL,
	`mime_type` text NOT NULL,
	`file_size` integer NOT NULL,
	`drive_file_id` text NOT NULL,
	`drive_url` text NOT NULL,
	`status_upload` text DEFAULT 'belum_upload' NOT NULL,
	`status_verifikasi` text DEFAULT 'belum_diverifikasi' NOT NULL,
	`status_kelengkapan` text DEFAULT 'belum_lengkap' NOT NULL,
	`catatan_revisi` text,
	`uploaded_by` text,
	`verified_by` text,
	`uploaded_at` integer,
	`verified_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` text PRIMARY KEY NOT NULL,
	`sekolah_id` text NOT NULL,
	`nama` text NOT NULL,
	`nik` text NOT NULL,
	`nip` text,
	`nuptk` text,
	`email` text,
	`no_hp` text,
	`tempat_lahir` text,
	`tanggal_lahir` text,
	`jenis_kelamin` text,
	`jabatan` text,
	`status_pegawai` text,
	`pangkat_golongan` text,
	`pendidikan_terakhir` text,
	`jurusan` text,
	`sertifikasi` text,
	`tmt_kerja` text,
	`tanggal_bup` text,
	`foto_url` text,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`sekolah_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `infrastructure` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`tahun_pelajaran` text NOT NULL,
	`jenis_sarpras` text NOT NULL,
	`jumlah` integer DEFAULT 0 NOT NULL,
	`kondisi_baik` integer DEFAULT 0 NOT NULL,
	`rusak_ringan` integer DEFAULT 0 NOT NULL,
	`rusak_sedang` integer DEFAULT 0 NOT NULL,
	`rusak_berat` integer DEFAULT 0 NOT NULL,
	`kebutuhan` integer DEFAULT 0 NOT NULL,
	`foto_url` text,
	`keterangan` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`is_read` integer DEFAULT 0 NOT NULL,
	`related_link` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`periode_bulan` integer NOT NULL,
	`tahun` integer NOT NULL,
	`jenis_laporan` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`submitted_by` text,
	`verified_by` text,
	`submitted_at` integer,
	`verified_at` integer,
	`catatan_revisi` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `schools` (
	`id` text PRIMARY KEY NOT NULL,
	`nama` text NOT NULL,
	`npsn` text NOT NULL,
	`jenjang` text NOT NULL,
	`status` text NOT NULL,
	`alamat` text NOT NULL,
	`desa` text NOT NULL,
	`kecamatan` text NOT NULL,
	`kepala_id` text,
	`latitude` real,
	`longitude` real,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `schools_npsn_unique` ON `schools` (`npsn`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`value` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `settings_key_unique` ON `settings` (`key`);--> statement-breakpoint
CREATE TABLE `student_recaps` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`tahun_pelajaran` text NOT NULL,
	`semester` text NOT NULL,
	`kelas_kelompok` text NOT NULL,
	`laki_laki` integer DEFAULT 0 NOT NULL,
	`perempuan` integer DEFAULT 0 NOT NULL,
	`total` integer DEFAULT 0 NOT NULL,
	`siswa_masuk` integer DEFAULT 0 NOT NULL,
	`siswa_keluar` integer DEFAULT 0 NOT NULL,
	`keterangan` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `students` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`tahun_pelajaran` text NOT NULL,
	`jenjang` text NOT NULL,
	`kelas_kelompok` text NOT NULL,
	`nama` text NOT NULL,
	`nik` text,
	`nisn` text,
	`jenis_kelamin` text,
	`tempat_lahir` text,
	`tanggal_lahir` text,
	`alamat` text,
	`nama_orang_tua` text,
	`status_siswa` text DEFAULT 'aktif' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL,
	`email` text,
	`role` text NOT NULL,
	`sekolah_id` text,
	`pegawai_id` text,
	`avatar_url` text,
	`is_active` integer DEFAULT 1 NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);