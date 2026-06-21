DROP TABLE IF EXISTS `infrastructure`;
--> statement-breakpoint
CREATE TABLE `tanah` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`nama_tanah` text NOT NULL,
	`nomor_sertifikat` text,
	`jenis_lahan` text DEFAULT 'induk' NOT NULL,
	`panjang` real DEFAULT 0,
	`lebar` real DEFAULT 0,
	`luas` real DEFAULT 0,
	`status_kepemilikan` text DEFAULT 'milik_sendiri' NOT NULL,
	`pemilik` text,
	`luas_siap_bangun` real DEFAULT 0,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bangunan` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`nama_gedung` text NOT NULL,
	`jenis_prasarana` text,
	`jumlah_lantai` integer DEFAULT 1,
	`panjang` real DEFAULT 0,
	`lebar` real DEFAULT 0,
	`luas_tapak` real DEFAULT 0,
	`tahun_dibangun` integer,
	`tahun_renovasi` integer,
	`nilai_perolehan` real DEFAULT 0,
	`kondisi_pondasi` integer DEFAULT 0,
	`kondisi_kolom` integer DEFAULT 0,
	`kondisi_balok` integer DEFAULT 0,
	`kondisi_pelat_lantai` integer DEFAULT 0,
	`kondisi_atap` integer DEFAULT 0,
	`keterangan` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `ruang` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`bangunan_id` text,
	`kode_ruang` text,
	`nama_ruang` text NOT NULL,
	`lantai_ke` integer DEFAULT 1,
	`panjang` real DEFAULT 0,
	`lebar` real DEFAULT 0,
	`kapasitas_siswa` integer DEFAULT 0,
	`kondisi_non_struktur` text,
	`jenis_ruang` text DEFAULT 'umum',
	`peruntukan_wc` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`bangunan_id`) REFERENCES `bangunan`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sub_ruang` (
	`id` text PRIMARY KEY NOT NULL,
	`ruang_id` text NOT NULL,
	`nama` text NOT NULL,
	`jumlah` integer DEFAULT 1,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`ruang_id`) REFERENCES `ruang`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sarana` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`ruang_id` text,
	`nama_sarana` text NOT NULL,
	`jenis` text DEFAULT 'alat' NOT NULL,
	`jumlah` integer DEFAULT 0,
	`kondisi` text DEFAULT 'baik',
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ruang_id`) REFERENCES `ruang`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `buku` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`jenis_buku` text NOT NULL,
	`jumlah_judul` integer DEFAULT 0,
	`jumlah_eksemplar` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action
);
