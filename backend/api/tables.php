<?php
/**
 * Dining Tables API Endpoint
 * Handles fetching tables with current reservation info and updating table statuses
 */

require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetTables($pdo);
        break;

    case 'PUT':
        handleUpdateTable($pdo);
        break;

    default:
        sendJsonResponse(405, [
            'success' => false,
            'message' => "Method {$method} not allowed on /api/tables.php"
        ]);
        break;
}

/**
 * GET: Fetch all dining tables with active reservation info
 */
function handleGetTables(PDO $pdo): void {
    try {
        // Query tables with active reservation details if any
        $sql = "
            SELECT 
                t.id,
                t.table_number,
                t.capacity,
                t.zone,
                t.status,
                t.created_at,
                r.id AS active_reservation_id,
                r.customer_name AS current_guest,
                r.phone AS guest_phone,
                r.party_size AS guest_party_size,
                r.reservation_time AS current_booking_time,
                r.reservation_date AS current_booking_date,
                r.status AS current_reservation_status,
                r.special_requests AS guest_special_requests
            FROM tables t
            LEFT JOIN (
                SELECT r1.*
                FROM reservations r1
                INNER JOIN (
                    SELECT table_id, MIN(id) as min_id
                    FROM reservations
                    WHERE status IN ('confirmed', 'seated')
                    GROUP BY table_id
                ) r2 ON r1.id = r2.min_id
            ) r ON t.id = r.table_id
            ORDER BY t.id ASC
        ";

        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $tables = $stmt->fetchAll();

        // Convert capacities to integer
        foreach ($tables as &$tbl) {
            $tbl['id'] = (int)$tbl['id'];
            $tbl['capacity'] = (int)$tbl['capacity'];
            if ($tbl['active_reservation_id'] !== null) {
                $tbl['active_reservation_id'] = (int)$tbl['active_reservation_id'];
                $tbl['guest_party_size'] = (int)$tbl['guest_party_size'];
            }
        }

        sendJsonResponse(200, [
            'success' => true,
            'count' => count($tables),
            'data' => $tables
        ]);
    } catch (Exception $e) {
        sendJsonResponse(500, [
            'success' => false,
            'message' => 'Failed to fetch dining tables: ' . $e->getMessage()
        ]);
    }
}

/**
 * PUT: Update a table's status
 */
function handleUpdateTable(PDO $pdo): void {
    $data = getRequestBody();

    $tableId = isset($data['id']) ? (int)$data['id'] : (isset($_GET['id']) ? (int)$_GET['id'] : null);
    $status = isset($data['status']) ? trim(strtolower($data['status'])) : null;

    if (!$tableId || empty($status)) {
        sendJsonResponse(400, [
            'success' => false,
            'message' => 'Table ID and valid status (available, occupied, reserved) are required.'
        ]);
    }

    $validStatuses = ['available', 'occupied', 'reserved'];
    if (!in_array($status, $validStatuses, true)) {
        sendJsonResponse(400, [
            'success' => false,
            'message' => "Invalid status '{$status}'. Allowed values: " . implode(', ', $validStatuses)
        ]);
    }

    try {
        // Check if table exists
        $checkStmt = $pdo->prepare("SELECT * FROM tables WHERE id = ?");
        $checkStmt->execute([$tableId]);
        $table = $checkStmt->fetch();

        if (!$table) {
            sendJsonResponse(404, [
                'success' => false,
                'message' => "Table with ID {$tableId} not found."
            ]);
        }

        // Update table status
        $updateStmt = $pdo->prepare("UPDATE tables SET status = ? WHERE id = ?");
        $updateStmt->execute([$status, $tableId]);

        // If table is freed to available, update any active seated reservation to completed if requested
        if ($status === 'available' && !empty($data['complete_reservation'])) {
            $pdo->prepare("UPDATE reservations SET status = 'completed' WHERE table_id = ? AND status IN ('confirmed', 'seated')")
                ->execute([$tableId]);
        }

        // Fetch updated table info
        $fetchStmt = $pdo->prepare("
            SELECT t.*, r.customer_name AS current_guest, r.status AS current_reservation_status
            FROM tables t
            LEFT JOIN reservations r ON t.id = r.table_id AND r.status IN ('confirmed', 'seated')
            WHERE t.id = ?
        ");
        $fetchStmt->execute([$tableId]);
        $updated = $fetchStmt->fetch();

        sendJsonResponse(200, [
            'success' => true,
            'message' => "Table {$updated['table_number']} status updated to '{$status}'.",
            'data' => $updated
        ]);
    } catch (Exception $e) {
        sendJsonResponse(500, [
            'success' => false,
            'message' => 'Error updating table status: ' . $e->getMessage()
        ]);
    }
}
