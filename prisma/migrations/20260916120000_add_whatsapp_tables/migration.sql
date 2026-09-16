-- CreateTable whatsapp_campaigns
CREATE TABLE IF NOT EXISTS `whatsapp_campaigns` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(255) NOT NULL DEFAULT 'UUID()',
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `type` VARCHAR(100) NOT NULL DEFAULT 'CUSTOM',
    `status` VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    `message` TEXT NOT NULL,
    `media_url` VARCHAR(500) NULL,
    `scheduled_at` TIMESTAMP(0) NULL,
    `started_at` TIMESTAMP(0) NULL,
    `completed_at` TIMESTAMP(0) NULL,
    `total_recipients` INTEGER NOT NULL DEFAULT 0,
    `sent_count` INTEGER NOT NULL DEFAULT 0,
    `failed_count` INTEGER NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),

    INDEX `idx_wac_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable whatsapp_campaign_recipients
CREATE TABLE IF NOT EXISTS `whatsapp_campaign_recipients` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `campaign_id` BIGINT UNSIGNED NOT NULL,
    `customer_id` BIGINT UNSIGNED NULL,
    `customer_name` VARCHAR(255) NULL,
    `phone_number` VARCHAR(50) NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'QUEUED',
    `error_message` TEXT NULL,
    `message_id` VARCHAR(100) NULL,
    `sent_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),

    INDEX `idx_wacr_camp_status`(`campaign_id`, `status`),
    UNIQUE INDEX `uq_wacr_camp_phone`(`campaign_id`, `phone_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable whatsapp_templates
CREATE TABLE IF NOT EXISTS `whatsapp_templates` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `category` VARCHAR(100) NOT NULL DEFAULT 'FESTIVAL',
    `message` TEXT NOT NULL,
    `media_url` VARCHAR(500) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0) ON UPDATE CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `whatsapp_campaign_recipients` ADD CONSTRAINT `fk_wacr_campaign` FOREIGN KEY (`campaign_id`) REFERENCES `whatsapp_campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
