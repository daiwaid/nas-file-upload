<?php

header("Access-Control-Allow-Origin: *");

if ($_SERVER['REQUEST_METHOD'] === 'GET') {

	$extensions = ['jpg', 'jpeg', 'png'];

	$host = 'localhost';
	$dbname = 'photo_album';
	$username = 'root';
	$password = '???';

	$conn = new mysqli($host, $username, $password, $dbname);

	if ($conn->connect_error) {
    	die("could not connect to the database:" . $pe->getMessage());
	}

	if (isset($_GET['name'])) {
		$name = $_GET['name'];
		$result = $conn->query("SELECT * FROM $name ORDER BY date_created DESC");


	}
	else {
		$result = $conn->query("SELECT * FROM main ORDER BY year DESC, month DESC");
	}



	
	header("Content-type: application/json");
	echo(json_encode($result->fetch_all(MYSQLI_ASSOC)));
	exit();

}
