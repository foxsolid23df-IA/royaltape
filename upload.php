<?php
/**
 * Royal Tape - Image Upload Handler
 * 
 * This script handles product image uploads for the admin panel.
 * Place this file in the root of your hosting directory.
 */

// Set headers for JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

// Configuration
$uploadDir = 'img/productos/';
$maxFileSize = 5 * 1024 * 1024; // 5MB
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Create upload directory if it doesn't exist
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

// Check if file was uploaded
if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Error al subir el archivo']);
    exit();
}

// Get SKU from request
$sku = isset($_POST['sku']) ? trim($_POST['sku']) : '';
if (empty($sku)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'SKU no proporcionado']);
    exit();
}

// Sanitize SKU for filename
$sku = preg_replace('/[^a-zA-Z0-9_-]/', '', $sku);

$file = $_FILES['image'];

// Validate file size
if ($file['size'] > $maxFileSize) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'El archivo excede el tamaño maximo de 5MB']);
    exit();
}

// Validate file type
$fileInfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($fileInfo, $file['tmp_name']);
finfo_close($fileInfo);

if (!in_array($mimeType, $allowedTypes)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Tipo de archivo no permitido']);
    exit();
}

// Get file extension
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$extension = strtolower($extension);

// Map MIME type to extension
$mimeToExt = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/gif' => 'gif',
    'image/webp' => 'webp'
];
$extension = $mimeToExt[$extension] ?? $extension;

// Create filename
$filename = $sku . '.' . $extension;
$filepath = $uploadDir . $filename;

// Delete existing image with same SKU (any extension)
$existingFiles = glob($uploadDir . $sku . '.*');
foreach ($existingFiles as $existingFile) {
    if (is_file($existingFile)) {
        unlink($existingFile);
    }
}

// Move uploaded file
if (move_uploaded_file($file['tmp_name'], $filepath)) {
    // Optimize image (optional - requires GD library)
    optimizeImage($filepath, $mimeType);
    
    echo json_encode([
        'success' => true,
        'message' => 'Imagen subida correctamente',
        'filename' => $filename,
        'url' => $filepath
    ]);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al guardar el archivo']);
}

/**
 * Optimize image for web
 */
function optimizeImage($filepath, $mimeType) {
    // Check if GD library is available
    if (!function_exists('imagecreatefromjpeg')) {
        return;
    }
    
    $maxWidth = 800;
    $maxHeight = 800;
    
    // Create image from file
    switch ($mimeType) {
        case 'image/jpeg':
            $image = imagecreatefromjpeg($filepath);
            break;
        case 'image/png':
            $image = imagecreatefrompng($filepath);
            break;
        case 'image/gif':
            $image = imagecreatefromgif($filepath);
            break;
        case 'image/webp':
            if (function_exists('imagecreatefromwebp')) {
                $image = imagecreatefromwebp($filepath);
            } else {
                return;
            }
            break;
        default:
            return;
    }
    
    if (!$image) {
        return;
    }
    
    // Get dimensions
    $width = imagesx($image);
    $height = imagesy($image);
    
    // Calculate new dimensions
    if ($width > $maxWidth || $height > $maxHeight) {
        $ratio = min($maxWidth / $width, $maxHeight / $height);
        $newWidth = (int)($width * $ratio);
        $newHeight = (int)($height * $ratio);
        
        // Resize
        $newImage = imagecreatetruecolor($newWidth, $newHeight);
        imagecopyresampled($newImage, $image, 0, 0, 0, 0, $newWidth, $newHeight, $width, $height);
        
        // Replace original
        imagedestroy($image);
        $image = $newImage;
    }
    
    // Save optimized image
    switch ($mimeType) {
        case 'image/jpeg':
            imagejpeg($image, $filepath, 85);
            break;
        case 'image/png':
            imagepng($image, $filepath, 6);
            break;
        case 'image/gif':
            imagegif($image, $filepath);
            break;
        case 'image/webp':
            if (function_exists('imagewebp')) {
                imagewebp($image, $filepath, 85);
            }
            break;
    }
    
    imagedestroy($image);
}
?>
