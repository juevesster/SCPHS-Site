<?php
// api/counter.php
declare(strict_types=1);

// Timezone so "today" matches your local day
date_default_timezone_set('Asia/Manila');

// Store DB beside this script
$dbFile = __DIR__ . '/counter.db';

// Debounce via cookie: 1 count per visitor per hour (adjust as you like)
$cookieName = 'view_counted';
$cookieTtlSeconds = 3600;

// Basic JSON & CORS
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }

try {
    $init = !file_exists($dbFile);
    $pdo = new PDO('sqlite:' . $dbFile, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);

    if ($init) {
        $pdo->exec("CREATE TABLE IF NOT EXISTS stats (k TEXT PRIMARY KEY, v INTEGER NOT NULL);");
        $pdo->prepare("INSERT OR IGNORE INTO stats (k, v) VALUES ('total', 0)")->execute();
    }

    // Helper functions
    $get = function(string $key) use ($pdo): int {
        $stmt = $pdo->prepare("SELECT v FROM stats WHERE k = :k LIMIT 1");
        $stmt->execute([':k' => $key]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ? (int)$row['v'] : 0;
    };
    $incr = function(string $key) use ($pdo): void {
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("INSERT INTO stats (k, v) VALUES (:k, 1)
                                   ON CONFLICT(k) DO UPDATE SET v = v + 1");
            $stmt->execute([':k' => $key]);
            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack(); throw $e;
        }
    };

    $todayKey = date('Y-m-d');

    // Debounce
    $shouldCount = !isset($_COOKIE[$cookieName]);
    if ($shouldCount) {
        setcookie($cookieName, '1', [
            'expires'  => time() + $cookieTtlSeconds,
            'path'     => '/',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        $incr('total');
        $incr($todayKey);
    }

    echo json_encode([
        'today' => $get($todayKey),
        'total' => $get('total'),
        'date'  => $todayKey,
    ]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => true, 'message' => 'Counter server error']);
}
