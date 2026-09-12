<?php

require __DIR__ . '/db.php';

header("Access-Control-Allow-Origin: *");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {

	$extensions = ['jpg', 'jpeg', 'png'];

	$conn = dbConnect();

	try {
		if (isset($_GET['name'])) {
			$name = $_GET['name'];
			$result = $conn->query("SELECT * FROM `$name` ORDER BY date_created DESC");
		}
		else {
			$result = $conn->query("SELECT * FROM main ORDER BY year DESC, month DESC");
		}
	} catch (Throwable $e) {
		dbFail('query failed', ['detail' => $e->getMessage()]);
	}

	header("Content-type: application/json");
	echo(json_encode($result->fetch_all(MYSQLI_ASSOC)));
	exit();

}
