-- Tables of this resource: CREATE TABLE IF NOT EXISTS, names prefixed with the resource (ai_<name>_...),
-- every table ending with ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;".
-- Installed by createDatabaseTables on start: missing tables and columns are added, nothing is dropped,
-- keys are only created with a new table (plan indexes before the first release).

-- One look per character (ai_core_characters.id); `data` is the Appearance JSON (resource/common/appearance.ts).
CREATE TABLE IF NOT EXISTS `ai_appearance_characters` (
  `char_id` INT UNSIGNED NOT NULL,
  `model` VARCHAR(32) NOT NULL,
  `data` TEXT NOT NULL,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`char_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
