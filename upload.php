<?php
// Config headers for CORS & JSON response
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$uploadDir = __DIR__ . '/uploads/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

// Handle GET request: Return list of uploaded media files
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    header("Content-Type: application/json; charset=utf-8");
    $files = [];
    if (is_dir($uploadDir)) {
        $dir = scandir($uploadDir);
        foreach ($dir as $file) {
            if ($file !== '.' && $file !== '..' && !is_dir($uploadDir . $file) && $file !== '.gitkeep') {
                $filePath = $uploadDir . $file;
                $files[] = [
                    'filename' => $file,
                    'url' => 'uploads/' . $file,
                    'size' => filesize($filePath),
                    'mtime' => filemtime($filePath)
                ];
            }
        }
    }
    usort($files, function($a, $b) {
        return $b['mtime'] - $a['mtime'];
    });
    echo json_encode([
        'success' => true,
        'files' => $files
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

// Handle POST request: Upload video / audio / image media file
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header("Content-Type: application/json; charset=utf-8");
    $fileObj = null;
    if (isset($_FILES['file'])) {
        $fileObj = $_FILES['file'];
    } elseif (isset($_FILES['media'])) {
        $fileObj = $_FILES['media'];
    } elseif (isset($_FILES['video'])) {
        $fileObj = $_FILES['video'];
    }

    if (!$fileObj || $fileObj['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        $errCode = $fileObj ? $fileObj['error'] : 'No file input';
        echo json_encode([
            'success' => false,
            'error' => 'Chưa chọn file hoặc xảy ra lỗi upload (mã lỗi: ' . $errCode . ')'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    $originalName = basename($fileObj['name']);
    $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $allowedExtensions = ['mp4', 'webm', 'ogg', 'mov', 'm4v', 'mp3', 'wav', 'jpg', 'png', 'jpeg', 'gif', 'webp', 'pdf'];

    if (!in_array($ext, $allowedExtensions)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Định dạng file không hợp lệ! Vui lòng chọn file media (mp4, webm, mp3, jpg, png, ...)'
        ], JSON_UNESCAPED_UNICODE);
        exit();
    }

    $safeName = 'media_' . date('Ymd_His') . '_' . uniqid() . '.' . $ext;
    $targetPath = $uploadDir . $safeName;

    if (move_uploaded_file($fileObj['tmp_name'], $targetPath)) {
        $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443)) ? "https://" : "http://";
        $host = isset($_SERVER['HTTP_HOST']) ? $_SERVER['HTTP_HOST'] : 'localhost';
        $fullUrl = $protocol . $host . '/uploads/' . $safeName;
        $relativeUrl = 'uploads/' . $safeName;

        echo json_encode([
            'success' => true,
            'url' => $relativeUrl,
            'fullUrl' => $fullUrl,
            'filename' => $safeName,
            'originalName' => $originalName,
            'size' => filesize($targetPath),
            'type' => $fileObj['type']
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Không thể lưu file vào thư mục uploads'
        ], JSON_UNESCAPED_UNICODE);
    }
    exit();
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed'], JSON_UNESCAPED_UNICODE);
?>
