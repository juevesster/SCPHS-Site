<?php
// upload-hero.php
// Minimal, safe-ish handler to replace the hero Slide 1 image.
// TIP: Add proper auth later (JWT/session). For now, we accept a simple Bearer token.

header('Content-Type: application/json');

// ----- CONFIG -----
$targetDir  = __DIR__ . '/assets/images/';
$targetName = 'Slider-Welcome.png';             // The file that the hero uses
$targetFile = $targetDir . $targetName;
$maxBytes   = 5 * 1024 * 1024;                  // 5MB limit
$allowed    = ['image/png','image/jpeg','image/webp'];

// ----- SIMPLE ACCESS GUARD (optional but recommended) -----
// Set a secret token here and in your JS (Authorization header).
$SECRET = 'replace-with-a-strong-random-token'; // e.g., 32+ chars
$auth   = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if ($SECRET && (!str_starts_with($auth, 'Bearer ') || trim(substr($auth, 7)) !== $SECRET)) {
  http_response_code(401);
  echo json_encode(['ok'=>false, 'msg'=>'Unauthorized']);
  exit;
}

// Validate file presence
if (!isset($_FILES['heroImage'])) {
  http_response_code(400);
  echo json_encode(['ok'=>false, 'msg'=>'No file uploaded']);
  exit;
}

$file = $_FILES['heroImage'];

// Validate size
if ($file['size'] <= 0 || $file['size'] > $maxBytes) {
  http_response_code(413);
  echo json_encode(['ok'=>false, 'msg'=>'File too large (max 5MB)']);
  exit;
}

// Validate type
$mime = mime_content_type($file['tmp_name']);
if (!in_array($mime, $allowed, true)) {
  http_response_code(415);
  echo json_encode(['ok'=>false, 'msg'=>'Only PNG, JPG/JPEG, or WEBP allowed']);
  exit;
}

// Ensure target directory exists & is writable
if (!is_dir($targetDir) && !mkdir($targetDir, 0755, true)) {
  http_response_code(500);
  echo json_encode(['ok'=>false, 'msg'=>'Failed to create target directory']);
  exit;
}
if (!is_writable($targetDir)) {
  http_response_code(500);
  echo json_encode(['ok'=>false, 'msg'=>'Upload directory not writable']);
  exit;
}

// Move uploaded file (overwrite the hero image)
if (move_uploaded_file($file['tmp_name'], $targetFile)) {
  // Return a cache-busted URL so browsers see the new image immediately
  $url = '/assets/images/' . $targetName . '?v=' . time();
  echo json_encode(['ok'=>true, 'url'=>$url]);
  exit;
} else {
  http_response_code(500);
  echo json_encode(['ok'=>false, 'msg'=>'Failed to save uploaded file']);
  exit;
}