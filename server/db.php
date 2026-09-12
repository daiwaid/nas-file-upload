<?php

function envValue($key, $default) {
    $value = getenv($key);
    if ($value !== false && $value !== '') {
        return $value;
    }
    if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') {
        return $_SERVER[$key];
    }
    return $default;
}

function dbFail($detail, $extra = []) {
    http_response_code(500);
    header('Content-type: application/json');
    echo json_encode(array_merge(['error' => $detail], $extra));
    exit();
}

function dbConnect() {
    $host = envValue('DB_HOST', 'localhost');
    $name = envValue('DB_NAME', 'photo_album');
    $user = envValue('DB_USER', 'root');
    $pass = envValue('DB_PASSWORD', '20011210');

    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
    try {
        $conn = new mysqli($host, $user, $pass, $name);
    } catch (Throwable $e) {
        dbFail('could not connect to the database', [
            'detail' => $e->getMessage(),
            'host' => $host,
            'name' => $name,
        ]);
    }

    $conn->query("CREATE TABLE IF NOT EXISTS main (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(128),
        year INT,
        month INT
    )");
    return $conn;
}
