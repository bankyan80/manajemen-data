-- Update existing 'paud' jenjang values to 'kb'
UPDATE schools SET jenjang = 'kb' WHERE jenjang = 'paud';
UPDATE students SET jenjang = 'kb' WHERE jenjang = 'paud';
