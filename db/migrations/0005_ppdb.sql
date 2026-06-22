CREATE TABLE IF NOT EXISTS `ppdb` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`tahun_pelajaran` text NOT NULL,
	`daya_tampung` integer DEFAULT 0,
	`jumlah_pendaftar` integer DEFAULT 0,
	`jumlah_diterima` integer DEFAULT 0,
	`jalur_domisili` integer DEFAULT 0,
	`jalur_afirmasi` integer DEFAULT 0,
	`jalur_mutasi` integer DEFAULT 0,
	`rekap_usia` text,
	`kekurangan_kelebihan_kuota` integer DEFAULT 0,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`)
);
