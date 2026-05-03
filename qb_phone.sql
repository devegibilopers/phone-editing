-- =====================================================
-- QB-PHONE DATABASE TABLES
-- Bu SQL dosyasını phpMyAdmin veya MySQL istemcisinde çalıştır
-- =====================================================

-- Kullanıcı telefon numaraları ve ayarlar
CREATE TABLE IF NOT EXISTS `qb_phone_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `citizenid` varchar(50) NOT NULL,
  `phone_number` varchar(20) NOT NULL,
  `settings` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `citizenid` (`citizenid`),
  UNIQUE KEY `phone_number` (`phone_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Rehber
CREATE TABLE IF NOT EXISTS `qb_phone_contacts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `citizenid` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `number` varchar(20) NOT NULL,
  `avatar` varchar(255) DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `citizenid` (`citizenid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Mesajlar
CREATE TABLE IF NOT EXISTS `qb_phone_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sender_citizenid` varchar(50) NOT NULL,
  `sender_number` varchar(20) NOT NULL,
  `receiver_citizenid` varchar(50) NOT NULL,
  `receiver_number` varchar(20) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `sender_citizenid` (`sender_citizenid`),
  KEY `receiver_citizenid` (`receiver_citizenid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Arama geçmişi
CREATE TABLE IF NOT EXISTS `qb_phone_calls` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `caller_number` varchar(20) NOT NULL,
  `receiver_number` varchar(20) NOT NULL,
  `status` enum('completed','missed','declined') NOT NULL DEFAULT 'completed',
  `duration` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `caller_number` (`caller_number`),
  KEY `receiver_number` (`receiver_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sosyal medya gönderileri
CREATE TABLE IF NOT EXISTS `qb_phone_social_posts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `citizenid` varchar(50) NOT NULL,
  `author_name` varchar(100) NOT NULL,
  `content` text NOT NULL,
  `image` varchar(500) DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `citizenid` (`citizenid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sosyal medya beğenileri
CREATE TABLE IF NOT EXISTS `qb_phone_social_likes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `post_id` int(11) NOT NULL,
  `citizenid` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_like` (`post_id`, `citizenid`),
  KEY `citizenid` (`citizenid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Banka işlemleri (log)
CREATE TABLE IF NOT EXISTS `qb_phone_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `citizenid` varchar(50) NOT NULL,
  `type` varchar(50) NOT NULL,
  `amount` int(11) NOT NULL DEFAULT 0,
  `description` varchar(255) DEFAULT NULL,
  `other_party` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `citizenid` (`citizenid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- İş ilanları
CREATE TABLE IF NOT EXISTS `qb_phone_job_ads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `citizenid` varchar(50) NOT NULL,
  `author_name` varchar(100) NOT NULL,
  `title` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `salary` int(11) DEFAULT 0,
  `contact_number` varchar(20) DEFAULT '',
  `expires_at` timestamp NOT NULL DEFAULT (current_timestamp() + interval 7 day),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `citizenid` (`citizenid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Galeri
CREATE TABLE IF NOT EXISTS `qb_phone_gallery` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `citizenid` varchar(50) NOT NULL,
  `url` varchar(500) NOT NULL,
  `caption` varchar(255) DEFAULT '',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `citizenid` (`citizenid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Müzik çalma listeleri
CREATE TABLE IF NOT EXISTS `qb_phone_music` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `citizenid` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `songs` longtext DEFAULT '[]',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `citizenid` (`citizenid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
