DROP TABLE IF EXISTS `infrastructure`;
--> statement-breakpoint
CREATE TABLE `infrastructure` (
	`id` text PRIMARY KEY NOT NULL,
	`school_id` text NOT NULL,
	`tahun_pelajaran` text NOT NULL,
	`kategori` text NOT NULL,
	`data` text DEFAULT '{}' NOT NULL,
	`keterangan` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`school_id`) REFERENCES `schools`(`id`) ON UPDATE no action ON DELETE no action
);
