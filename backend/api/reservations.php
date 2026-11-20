<?php
/**
 * Reservations API Endpoint
 * Handles CRUD operations, automated table assignment, capacity checks, and table status syncing
 */

require_once __DIR__ . '/../config/db.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        handleGetReservations($pdo);
        break;

    case 'POST':
        handleCreateReservation($pdo);
        break;

    case 'PUT':
        handleUpdateReservation($pdo);
        break;

    case 'DELETE':
        handleDeleteReservation($pdo);
        break;

    default:
        sendJsonResponse(405, [
            'success' => false,
            'message' => "Method {$method} not allowed on /api/reservations.php"
        ]);
        break;
}

/**
 * GET: Fetch reservations with optional filters (?date, ?search, ?status)
 */
function handleGetReservations(PDO $pdo): void {
    try {
        $whereClauses = [];
        $params = [];

        // Date filter
        if (!empty($_GET['date'])) {
            $whereClauses[] = "r.reservation_date = ?";
            $params[] = trim($_GET['date']);
        }

        // Status filter
        if (!empty($_GET['status'])) {
            $whereClauses[] = "r.status = ?";
            $params[] = trim($_GET['status']);
        }

        // Search filter (customer name, phone, email)
        if (!empty($_GET['search'])) {
            $searchTerm = '%' . trim($_GET['search']) . '%';
            $whereClauses[] = "(r.customer_name LIKE ? OR r.phone LIKE ? OR r.email LIKE ? OR t.table_number LIKE ?)";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }

        $sql = "
            SELECT 
                r.id,
                r.customer_name,
                r.phone,
                r.email,
                r.reservation_date,
                r.reservation_time,
                r.party_size,
                r.special_requests,
                r.table_id,
                r.status,
                r.created_at,
                t.table_number,
                t.capacity AS table_capacity,
                t.zone AS table_zone,
                t.status AS table_status
            FROM reservations r
            LEFT JOIN tables t ON r.table_id = t.id
        ";

        if (!empty($whereClauses)) {
            $sql .= " WHERE " . implode(' AND ', $whereClauses);
        }

        $sql .= " ORDER BY r.reservation_date DESC, r.reservation_time ASC, r.id DESC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $reservations = $stmt->fetchAll();

        foreach ($reservations as &$res) {
            $res['id'] = (int)$res['id'];
            $res['party_size'] = (int)$res['party_size'];
            $res['table_id'] = $res['table_id'] !== null ? (int)$res['table_id'] : null;
            $res['table_capacity'] = $res['table_capacity'] !== null ? (int)$res['table_capacity'] : null;
        }

        sendJsonResponse(200, [
            'success' => true,
            'count' => count($reservations),
            'data' => $reservations
        ]);
    } catch (Exception $e) {
        sendJsonResponse(500, [
            'success' => false,
            'message' => 'Failed to fetch reservations: ' . $e->getMessage()
        ]);
    }
}

/**
 * POST: Create a new reservation with auto-table assignment and validation
 */
function handleCreateReservation(PDO $pdo): void {
    $data = getRequestBody();

    // 1. Input sanitization & validation
    $customerName = trim($data['customer_name'] ?? '');
    $phone = preg_replace('/[^0-9+]/', '', trim($data['phone'] ?? ''));
    $email = trim(filter_var($data['email'] ?? '', FILTER_SANITIZE_EMAIL));
    $date = trim($data['reservation_date'] ?? '');
    $time = trim($data['reservation_time'] ?? '');
    $partySize = (int)($data['party_size'] ?? 0);
    $specialRequests = trim($data['special_requests'] ?? '');
    $requestedTableId = !empty($data['table_id']) ? (int)$data['table_id'] : null;
    $initialStatus = !empty($data['status']) ? trim(strtolower($data['status'])) : 'confirmed';

    $errors = [];
    if (strlen($customerName) < 2) {
        $errors[] = 'Customer name must be at least 2 characters long.';
    }
    if (strlen($phone) < 10) {
        $errors[] = 'A valid 10-digit phone number is required.';
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $errors[] = 'A valid email address is required.';
    }
    if (empty($date) || !strtotime($date)) {
        $errors[] = 'A valid reservation date is required.';
    }
    if (empty($time)) {
        $errors[] = 'A reservation time is required.';
    }
    if ($partySize < 1) {
        $errors[] = 'Party size must be at least 1 person.';
    }

    if (!empty($errors)) {
        sendJsonResponse(422, [
            'success' => false,
            'message' => 'Validation error',
            'errors' => $errors
        ]);
    }

    try {
        $assignedTable = null;

        // 2. Table Allocation Logic
        if ($requestedTableId !== null) {
            // User explicitly requested a specific table
            $stmt = $pdo->prepare("SELECT * FROM tables WHERE id = ?");
            $stmt->execute([$requestedTableId]);
            $table = $stmt->fetch();

            if (!$table) {
                sendJsonResponse(400, [
                    'success' => false,
                    'message' => "The selected table ID #{$requestedTableId} does not exist."
                ]);
            }

            if ((int)$table['capacity'] < $partySize) {
                sendJsonResponse(400, [
                    'success' => false,
                    'message' => "Selected Table {$table['table_number']} capacity ({$table['capacity']}) is smaller than party size ({$partySize})."
                ]);
            }

            // Check if table is already occupied
            if ($table['status'] === 'occupied') {
                sendJsonResponse(409, [
                    'success' => false,
                    'message' => "Table {$table['table_number']} is currently occupied."
                ]);
            }

            $assignedTable = $table;
        } else {
            // Automatic best-fit table assignment
            // Find available tables with capacity >= party_size, ordered by capacity ASC (best fit)
            $stmt = $pdo->prepare("
                SELECT * FROM tables
                WHERE status = 'available' AND capacity >= ?
                ORDER BY capacity ASC, id ASC
                LIMIT 1
            ");
            $stmt->execute([$partySize]);
            $assignedTable = $stmt->fetch();

            if (!$assignedTable) {
                sendJsonResponse(400, [
                    'success' => false,
                    'message' => "No available table fits a party of {$partySize}. Please choose another time slot or join the waitlist."
                ]);
            }
        }

        // 3. Begin Transaction
        $pdo->beginTransaction();

        $tableId = $assignedTable ? (int)$assignedTable['id'] : null;

        $insertSql = "
            INSERT INTO reservations (
                customer_name, phone, email, reservation_date, reservation_time,
                party_size, special_requests, table_id, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ";
        $insertStmt = $pdo->prepare($insertSql);
        $insertStmt->execute([
            $customerName,
            $phone,
            $email,
            $date,
            $time,
            $partySize,
            $specialRequests,
            $tableId,
            $initialStatus
        ]);

        $reservationId = (int)$pdo->lastInsertId();

        // 4. Update assigned table status
        if ($tableId) {
            $newTableStatus = ($initialStatus === 'seated') ? 'occupied' : 'reserved';
            $updateTableStmt = $pdo->prepare("UPDATE tables SET status = ? WHERE id = ?");
            $updateTableStmt->execute([$newTableStatus, $tableId]);
        }

        $pdo->commit();

        // 5. Fetch full created reservation with table details
        $fetchStmt = $pdo->prepare("
            SELECT r.*, t.table_number, t.capacity AS table_capacity, t.zone AS table_zone
            FROM reservations r
            LEFT JOIN tables t ON r.table_id = t.id
            WHERE r.id = ?
        ");
        $fetchStmt->execute([$reservationId]);
        $newReservation = $fetchStmt->fetch();

        sendJsonResponse(201, [
            'success' => true,
            'message' => "Reservation confirmed for {$customerName} — Table {$assignedTable['table_number']} ({$assignedTable['zone']}) assigned!",
            'data' => $newReservation
        ]);

    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        sendJsonResponse(500, [
            'success' => false,
            'message' => 'Error creating reservation: ' . $e->getMessage()
        ]);
    }
}

/**
 * PUT: Update reservation details, status, or reassign table
 */
function handleUpdateReservation(PDO $pdo): void {
    $data = getRequestBody();

    $resId = isset($data['id']) ? (int)$data['id'] : (isset($_GET['id']) ? (int)$_GET['id'] : null);
    if (!$resId) {
        sendJsonResponse(400, [
            'success' => false,
            'message' => 'Reservation ID is required for update.'
        ]);
    }

    try {
        // Fetch existing reservation
        $stmt = $pdo->prepare("SELECT * FROM reservations WHERE id = ?");
        $stmt->execute([$resId]);
        $existing = $stmt->fetch();

        if (!$existing) {
            sendJsonResponse(404, [
                'success' => false,
                'message' => "Reservation #{$resId} not found."
            ]);
        }

        $oldTableId = $existing['table_id'] !== null ? (int)$existing['table_id'] : null;
        $oldStatus = $existing['status'];

        // Extract updated values or fallback to existing
        $customerName = isset($data['customer_name']) ? trim($data['customer_name']) : $existing['customer_name'];
        $phone = isset($data['phone']) ? trim($data['phone']) : $existing['phone'];
        $email = isset($data['email']) ? trim($data['email']) : $existing['email'];
        $date = isset($data['reservation_date']) ? trim($data['reservation_date']) : $existing['reservation_date'];
        $time = isset($data['reservation_time']) ? trim($data['reservation_time']) : $existing['reservation_time'];
        $partySize = isset($data['party_size']) ? (int)$data['party_size'] : (int)$existing['party_size'];
        $specialRequests = isset($data['special_requests']) ? trim($data['special_requests']) : $existing['special_requests'];
        $newStatus = isset($data['status']) ? trim(strtolower($data['status'])) : $existing['status'];
        $newTableId = array_key_exists('table_id', $data) ? ($data['table_id'] ? (int)$data['table_id'] : null) : $oldTableId;

        $validStatuses = ['confirmed', 'seated', 'completed', 'cancelled'];
        if (!in_array($newStatus, $validStatuses, true)) {
            sendJsonResponse(400, [
                'success' => false,
                'message' => "Invalid status '{$newStatus}'. Allowed: " . implode(', ', $validStatuses)
            ]);
        }

        // Validate table change if table_id is specified
        if ($newTableId !== null && $newTableId !== $oldTableId) {
            $tblStmt = $pdo->prepare("SELECT * FROM tables WHERE id = ?");
            $tblStmt->execute([$newTableId]);
            $newTbl = $tblStmt->fetch();

            if (!$newTbl) {
                sendJsonResponse(400, [
                    'success' => false,
                    'message' => "New table #{$newTableId} does not exist."
                ]);
            }
            if ((int)$newTbl['capacity'] < $partySize) {
                sendJsonResponse(400, [
                    'success' => false,
                    'message' => "New table {$newTbl['table_number']} capacity ({$newTbl['capacity']}) cannot accommodate party size ({$partySize})."
                ]);
            }
        }

        $pdo->beginTransaction();

        // 1. Update reservation record
        $updateSql = "
            UPDATE reservations SET
                customer_name = ?,
                phone = ?,
                email = ?,
                reservation_date = ?,
                reservation_time = ?,
                party_size = ?,
                special_requests = ?,
                table_id = ?,
                status = ?
            WHERE id = ?
        ";
        $updateStmt = $pdo->prepare($updateSql);
        $updateStmt->execute([
            $customerName,
            $phone,
            $email,
            $date,
            $time,
            $partySize,
            $specialRequests,
            $newTableId,
            $newStatus,
            $resId
        ]);

        // 2. Handle Table Status Changes
        // Scenario A: Table changed
        if ($oldTableId !== null && $oldTableId !== $newTableId) {
            // Free the previous table
            $pdo->prepare("UPDATE tables SET status = 'available' WHERE id = ?")->execute([$oldTableId]);
        }

        // Scenario B: Status changed to completed or cancelled -> free the table
        if (in_array($newStatus, ['completed', 'cancelled'], true)) {
            $targetTable = $newTableId ?: $oldTableId;
            if ($targetTable) {
                $pdo->prepare("UPDATE tables SET status = 'available' WHERE id = ?")->execute([$targetTable]);
            }
        } elseif ($newStatus === 'seated') {
            // Guest seated -> mark table as occupied
            if ($newTableId) {
                $pdo->prepare("UPDATE tables SET status = 'occupied' WHERE id = ?")->execute([$newTableId]);
            }
        } elseif ($newStatus === 'confirmed') {
            // Confirmed reservation -> mark table as reserved
            if ($newTableId) {
                $pdo->prepare("UPDATE tables SET status = 'reserved' WHERE id = ?")->execute([$newTableId]);
            }
        }

        $pdo->commit();

        // 3. Return updated reservation
        $fetchStmt = $pdo->prepare("
            SELECT r.*, t.table_number, t.capacity AS table_capacity, t.zone AS table_zone, t.status AS table_status
            FROM reservations r
            LEFT JOIN tables t ON r.table_id = t.id
            WHERE r.id = ?
        ");
        $fetchStmt->execute([$resId]);
        $updatedRes = $fetchStmt->fetch();

        sendJsonResponse(200, [
            'success' => true,
            'message' => "Reservation #{$resId} updated successfully (Status: {$newStatus}).",
            'data' => $updatedRes
        ]);

    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        sendJsonResponse(500, [
            'success' => false,
            'message' => 'Failed to update reservation: ' . $e->getMessage()
        ]);
    }
}

/**
 * DELETE: Cancel / delete a reservation and release its table
 */
function handleDeleteReservation(PDO $pdo): void {
    $data = getRequestBody();
    $resId = isset($data['id']) ? (int)$data['id'] : (isset($_GET['id']) ? (int)$_GET['id'] : null);

    if (!$resId) {
        sendJsonResponse(400, [
            'success' => false,
            'message' => 'Reservation ID is required for deletion.'
        ]);
    }

    try {
        $stmt = $pdo->prepare("SELECT * FROM reservations WHERE id = ?");
        $stmt->execute([$resId]);
        $res = $stmt->fetch();

        if (!$res) {
            sendJsonResponse(404, [
                'success' => false,
                'message' => "Reservation #{$resId} not found."
            ]);
        }

        $pdo->beginTransaction();

        $tableId = $res['table_id'] ? (int)$res['table_id'] : null;

        // Delete the reservation
        $delStmt = $pdo->prepare("DELETE FROM reservations WHERE id = ?");
        $delStmt->execute([$resId]);

        // Release the assigned table
        if ($tableId) {
            // Check if another active reservation is waiting on this table
            $checkOther = $pdo->prepare("
                SELECT id FROM reservations 
                WHERE table_id = ? AND status IN ('confirmed', 'seated')
                LIMIT 1
            ");
            $checkOther->execute([$tableId]);
            if (!$checkOther->fetch()) {
                $pdo->prepare("UPDATE tables SET status = 'available' WHERE id = ?")->execute([$tableId]);
            }
        }

        $pdo->commit();

        sendJsonResponse(200, [
            'success' => true,
            'message' => "Reservation #{$resId} for {$res['customer_name']} cancelled and table released."
        ]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        sendJsonResponse(500, [
            'success' => false,
            'message' => 'Failed to delete reservation: ' . $e->getMessage()
        ]);
    }
}
