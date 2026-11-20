<?php
/**
 * Database Configuration & Connection Handler
 * Zaffran & Spice - Restaurant Reservation & Table Management System
 */

// Default REQUEST_METHOD if running under CLI
if (!isset($_SERVER['REQUEST_METHOD'])) {
    $_SERVER['REQUEST_METHOD'] = 'GET';
}

// Enable CORS headers for cross-origin React frontend communication
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Database Connection Settings (can be overridden via environment variables)
$host = getenv('DB_HOST') ?: '127.0.0.1';
$port = getenv('DB_PORT') ?: '3306';
$dbName = getenv('DB_NAME') ?: 'zaffran_spice_db';
$user = getenv('DB_USER') ?: 'root';
$pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : '';

$pdo = null;
$dbDriver = 'mysql';

try {
    // 1. Attempt MySQL connection with custom or default credentials
    $dsn = "mysql:host={$host};port={$port};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    $tempPdo = new PDO($dsn, $user, $pass, $options);
    // Create database if it does not exist
    $tempPdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $tempPdo = null;

    // Connect directly to the database
    $pdo = new PDO("mysql:host={$host};port={$port};dbname={$dbName};charset=utf8mb4", $user, $pass, $options);
    $dbDriver = 'mysql';

    // Auto-initialize tables if needed
    initializeDatabaseIfNeeded($pdo, 'mysql');

} catch (Throwable $e) {
    // 2. Resilient fallback to SQLite if MySQL is not available or credentials mismatch
    // This guarantees the API and frontend remain fully functional in any environment
    $sqlitePath = dirname(__DIR__) . '/database/zaffran_spice.sqlite';
    try {
        $pdo = new PDO("sqlite:" . $sqlitePath);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        $pdo->exec("PRAGMA foreign_keys = ON;");
        $dbDriver = 'sqlite';

        initializeDatabaseIfNeeded($pdo, 'sqlite');
    } catch (Throwable $sqle) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database connection failed: ' . $e->getMessage() . ' | SQLite error: ' . $sqle->getMessage()
        ]);
        exit;
    }
}

/**
 * Initialize schema and seed data if tables are missing
 */
function initializeDatabaseIfNeeded(PDO $pdo, string $driver): void {
    if ($driver === 'mysql') {
        $check = $pdo->query("SHOW TABLES LIKE 'tables'")->fetchAll();
        if (empty($check)) {
            $sqlFile = dirname(__DIR__) . '/database.sql';
            if (file_exists($sqlFile)) {
                $sql = file_get_contents($sqlFile);
                $pdo->exec($sql);
            }
        }
    } else {
        // SQLite schema setup
        $check = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='tables'")->fetchAll();
        if (empty($check)) {
            $pdo->exec("
                CREATE TABLE IF NOT EXISTS tables (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    table_number TEXT NOT NULL UNIQUE,
                    capacity INTEGER NOT NULL,
                    zone TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'available',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS reservations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    customer_name TEXT NOT NULL,
                    phone TEXT NOT NULL,
                    email TEXT NOT NULL,
                    reservation_date TEXT NOT NULL,
                    reservation_time TEXT NOT NULL,
                    party_size INTEGER NOT NULL,
                    special_requests TEXT,
                    table_id INTEGER,
                    status TEXT NOT NULL DEFAULT 'confirmed',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE SET NULL
                );

                INSERT INTO tables (id, table_number, capacity, zone, status) VALUES
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

                INSERT INTO reservations (id, customer_name, phone, email, reservation_date, reservation_time, party_size, special_requests, table_id, status) VALUES
                (1, 'Aarav Sharma',   '9876543210', 'aarav.sharma@example.com', date('now'), '19:30:00', 4, 'Window side, extra spicy appetizer request', 2, 'confirmed'),
                (2, 'Priya Patel',    '9822011223', 'priya.patel@example.com', date('now'), '20:00:00', 2, 'Anniversary celebration & rose petal setup', 5, 'confirmed'),
                (3, 'Rohan Deshmukh', '9765432109', 'rohan.d@example.com', date('now'), '20:30:00', 6, 'Strict Jain food preparation (no onion/garlic)', 8, 'confirmed'),
                (4, 'Ananya Iyer',    '9988776655', 'ananya.iyer@example.com', date('now'), '13:00:00', 4, 'Quiet corner table, high chair required for child', 4, 'seated');
            ");
        }
    }
}

/**
 * Standard JSON response helper
 */
function sendJsonResponse(int $statusCode, array $data): void {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Helper to parse raw JSON or form-encoded request body
 */
function getRequestBody(): array {
    $raw = file_get_contents('php://input');
    if (!empty($raw)) {
        $json = json_decode($raw, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($json)) {
            return $json;
        }
    }
    return $_POST ?: [];
}
