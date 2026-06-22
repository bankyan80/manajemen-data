CREATE TABLE IF NOT EXISTS `transitions` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`student_id` text,
	`tahun_pelajaran` text NOT NULL,
	`nama` text NOT NULL,
	`nisn` text,
	`jenis_kelamin` text,
	`kelas` text NOT NULL,
	`status_transisi` text NOT NULL DEFAULT 'calon_masuk',
	`smp_tujuan` text,
	`kesiapan` text,
	`kegiatan_transisi` text,
	`keterangan` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`),
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`)
);
