<?php 

require __DIR__ . '/db.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: content-type");

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $conn = dbConnect();

  $base_dir = '/var/share';
  // read data from post request
  $data = json_decode(file_get_contents('php://input'), true);
  $tbl_name = $data['table'];
  $img_name = $data['name'];
  
  // get image info from table
  $stmt = $conn->prepare("SELECT * FROM $tbl_name WHERE name=?;");
  $stmt->bind_param('s', $img_name);
  $stmt->execute();
  $result = $stmt->get_result();
  $row = $result->fetch_assoc();

  // delete images and remove from table
  unlink($base_dir . $row['path']);
  unlink($base_dir . $row['thumb']);

  $stmt = $conn->prepare("DELETE FROM $tbl_name WHERE name=?;");
  $stmt->bind_param('s', $img_name);
  $stmt->execute();
}