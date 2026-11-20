-- ====================================================================
-- Database Schema & Seed Data for Zaffran & Spice
-- Restaurant Reservation & Table Management System
-- ====================================================================

CREATE DATABASE IF NOT EXISTS `zaffran_spice_db`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `zaffran_spice_db`;

-- Drop tables if they exist (clean setup)
DROP TABLE IF EXISTS `reservations`;
DROP TABLE IF EXISTS `tables`;

-- --------------------------------------------------------------------
-- 1. Dining Tables Table
-- --------------------------------------------------------------------
CREATE TABLE `tables` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `table_number` VARCHAR(10) NOT NULL UNIQUE,
  `capacity` INT NOT NULL,
  `zone` VARCHAR(50) NOT NULL,
  `status` ENUM('available', 'occupied', 'reserved') NOT NULL DEFAULT 'available',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 2. Reservations Table
-- --------------------------------------------------------------------
CREATE TABLE `reservations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `customer_name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `reservation_date` DATE NOT NULL,
  `reservation_time` TIME NOT NULL,
  `party_size` INT NOT NULL,
  `special_requests` TEXT NULL,
  `table_id` INT NULL,
  `status` ENUM('confirmed', 'seated', 'completed', 'cancelled') NOT NULL DEFAULT 'confirmed',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_reservations_table`
    FOREIGN KEY (`table_id`) REFERENCES `tables`(`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- Seed Data: 10 Dining Tables across 3 Zones
-- --------------------------------------------------------------------
INSERT INTO `tables` (`id`, `table_number`, `capacity`, `zone`, `status`) VALUES
(1,  'T-1',  2, 'Main Dining',  'available'),
(2,  'T-2',  4, 'Main Dining',  'reserved'),
(3,  'T-3',  4, 'Main Dining',  'occupied'),
(4,  'T-4',  6, 'Main Dining',  'reserved'),
(5,  'T-5',  2, 'Courtyard',    'reserved'),
(6,  'T-6',  4, 'Courtyard',    'available'),
(7,  'T-7',  8, 'Courtyard',    'available'),
(8,  'T-8',  6, 'Royal Majlis', 'reserved'),
(9,  'T-9',  6, 'Royal Majlis', 'available'),
(10, 'T-10', 8, 'Royal Majlis', 'available');

-- --------------------------------------------------------------------
-- Seed Data: 4 Realistic Sample Reservations with Indian Guest Names
-- --------------------------------------------------------------------
INSERT INTO `reservations` (`id`, `customer_name`, `phone`, `email`, `reservation_date`, `reservation_time`, `party_size`, `special_requests`, `table_id`, `status`) VALUES
(1, 'Aarav Sharma',   '9876543210', 'aarav.sharma@example.com',   CURDATE(), '19:30:00', 4, 'Window side, extra spicy appetizer request', 2, 'confirmed'),
(2, 'Priya Patel',    '9822011223', 'priya.patel@example.com',    CURDATE(), '20:00:00', 2, 'Anniversary celebration & rose petal setup', 5, 'confirmed'),
(3, 'Rohan Deshmukh', '9765432109', 'rohan.d@example.com',        CURDATE(), '20:30:00', 6, 'Strict Jain food preparation (no onion/garlic)', 8, 'confirmed'),
(4, 'Ananya Iyer',    '9988776655', 'ananya.iyer@example.com',    CURDATE(), '13:00:00', 4, 'Quiet corner table, high chair required for child', 4, 'seated');
