<?php 

require __DIR__ . '/vendor/autoload.php';

header("Access-Control-Allow-Origin: *");

function convertHEIC($path) {
    if (Maestroerror\HeicToJpg::isHeic($path)) {
        $name = implode(explode('.', $path, -1));
        $new_path = $name . '.jpeg';
        Maestroerror\HeicToJpg::convert($path)->saveAs($new_path);
        unlink($path);
        return $new_path;
    }
    return $path;
}

function saveFile($tmp_path, $path, $conn, $tbl_name, $file_date=-1, $number=0) {	
    // rename the path if file name already exists	
	if ($number > 0) {
		$parts = explode('.', $path);
		$file_ext = array_pop($parts);
		$rest = implode('.', $parts);
		$new_path = $rest . '_' . $number . '.' . $file_ext;
	}
	else {
		$new_path = $path;
	}

    if (file_exists($new_path)) {
		// if size difference is small, assume it's the same
        if (abs(filesize($tmp_path) - filesize($new_path)) < min(0.1 * filesize($tmp_path), 0.1 * filesize($new_path))) {
			return;
		}
		saveFile($tmp_path, $path, $conn, $tbl_name, $file_date, $number+1);
		return;
	}

	move_uploaded_file($tmp_path, $new_path);
	$new_path = convertHEIC($new_path);
    if ($file_date > 0) {
		touch($new_path, $file_date);
	}

	addToTable($conn, $tbl_name, $new_path);
}

function findDate($path) {
    $exif_data = @exif_read_data($path);
    if ($exif_data) { // first try exif data (photos)
        if (array_key_exists('DateTime', $exif_data)) {
            $file_date = new DateTime($exif_data['DateTime']);
	    return $file_date->getTimestamp();
        }
    }
    else { // otherwise try more extensive tool
        eval('$array=' . `exiftool -php -TAG '-CreateDate' -dateFormat '%s' "$path"`);

        if (array_key_exists('CreateDate', $array[0])) {
	    return $array[0]['CreateDate'];	
        }
    }
    return -1;
}

function generateThumb($path, $ext, $orientation) {
    list($width, $height) = getimagesize($path);
    if ($ext === 'jpg' || $ext === 'jpeg') {
        $image = imagecreatefromjpeg($path);
    }
    else if ($ext === 'png') {
        $image = imagecreatefrompng($path);
    }
    else {
        return NULL;
    }

    $thumb_folder = dirname($path) . '/.thumbs/';
    if (!file_exists($thumb_folder)) {
        mkdir($thumb_folder, 0775, true);
    }

    $resize_factor = 1;
    while (max(intdiv($width, $resize_factor), intdiv($height, $resize_factor)) > 2100) {
        $resize_factor *= 2;
    }

    $resized = imagescale($image, intdiv($width, $resize_factor), intdiv($height, $resize_factor), IMG_NEAREST_NEIGHBOUR);
    switch($orientation) {
        case 3:
            $resized = imagerotate($resized, 180, 0);
            break;
        case 6:
            $resized = imagerotate($resized, 270, 0);
            break;
        case 8:
            $resized = imagerotate($resized, 90, 0);
            break;
    }
    $new_file = $thumb_folder . basename($path);

    if ($ext === 'jpg' || $ext === 'jpeg') {
        imagejpeg($resized, $new_file, 60);
    }
    else if ($ext === 'png') {
        imagepng($resized, $new_file);
    }

    return $new_file;

}

function generateTable($name, $conn, $year, $month) {
    $sql = "CREATE TABLE IF NOT EXISTS $name(
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(128),
            size INT,
            width INT NOT NULL,
            height INT NOT NULL,
            date_created DATETIME,
            path VARCHAR(512) NOT NULL,
            thumb VARCHAR(512))";
    $conn->query($sql);
    $stmt = $conn->prepare("INSERT INTO main(name, year, month)
            SELECT ?, $year, $month
            WHERE NOT EXISTS ( SELECT 1 FROM main WHERE name = ? )");
    $stmt->bind_param('ss', $name, $name);
    $stmt->execute();
}

function addToTable($conn, $tbl_name, $path) {
    $extensions = ['jpg', 'jpeg', 'png'];
    $file_ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
    if (in_array($file_ext, $extensions)) {

        $img_name = basename($path);
        $img_size = filesize($path);
        list($width, $height) = getimagesize($path);

        $orientation = 1;

        $timestamp = NULL;
        $exif_data = exif_read_data($path);
        if ($exif_data) { // first try exif data (photos)
            if (array_key_exists('DateTime', $exif_data)) {
                $file_date = new DateTime($exif_data['DateTime']);
                $timestamp = $file_date->format('Y-m-d H:i:s');
            }
            if (array_key_exists('Orientation', $exif_data)) {
                $orientation = $exif_data['Orientation'];
                if ($orientation === 6 || $orientation === 8) {
                    $temp = $width;
                    $width = $height;
                    $height = $temp;
                }
            }
        }
        else { // otherwise try more extensive tool
            eval('$array=' . `exiftool -php -TAG '-CreateDate' -api largefilesupport=1 -d "%Y-%m-%d %H:%M:%S" "$path"`);

            if (array_key_exists('CreateDate', $array[0])) {
                $timestamp = $array[0]['CreateDate'];
            }
        }

        $thumb = generateThumb($path, $file_ext, $orientation);
        $thumb = substr($thumb, 10);
        $path = substr($path, 10);


        $stmt = $conn->prepare("INSERT INTO $tbl_name(name, size, width, height, date_created, path, thumb)
            SELECT ?, $img_size, $width, $height, ?, ?, ?
            WHERE NOT EXISTS( SELECT 1 FROM $tbl_name WHERE name = ? );");
        $stmt->bind_param('sssss', $img_name, $timestamp, $path, $thumb, $img_name);
        $stmt->execute();
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
	$host = 'localhost';
	$dbname='photo_album';
	$username = 'root';
	$password = '???';

	$conn = new mysqli($host, $username, $password, $dbname);

	if ($conn->connect_error) {
		print_r("could not connect to the database:" . $pe->getMessage());
		exit();
	}

    if (isset($_FILES['files'])) {
	$path = '/var/share/lan-drive/';
	$subfolders = 'uncategorized/';
    $extensions = ['txt', 'jpg', 'jpeg', 'png', 'gif', 'HEIC'];

    $all_files = count($_FILES['files']['tmp_name']);

	for ($i = 0; $i < $all_files; $i++) {
	
        $file_name = $_FILES['files']['name'][$i];
        $file_tmp = $_FILES['files']['tmp_name'][$i];
        $file_type = $_FILES['files']['type'][$i];
	    $file_size = $_FILES['files']['size'][$i];
	    #$file_ext = pathinfo($file_name, PATHINFO_EXTENSION);

 	    /*if (!in_array($file_ext, $extensions)) {
                $errors[] = 'Extension not allowed: ' . $file_name . ' ' . $file_type;
	    }*/

		$file_date = findDate($file_tmp);
		$tbl_name = NULL;
	    if ($file_date > 0) {
			$file_datetime = new DateTime();
			$file_datetime->setTimestamp($file_date);
			$yr_mth = $file_datetime->format('Y-n');
			$subfolders = $file_datetime->format('Y') . '/' . $yr_mth . '/';
			
			$tbl_name = substr($subfolders, 0, -1);
			$tbl_name = str_replace('/', '$', $tbl_name);
			$tbl_name = str_replace('-', '_', $tbl_name);

			$temp = explode('-', $yr_mth);
			if (!file_exists($path . $subfolders)) {
				generateTable($tbl_name, $conn, $temp[0], $temp[1]);	
			}
		}

		$folders = $path . $subfolders;
	    if (!file_exists($folders)) {
			mkdir($folders, 0775, true);
	    }
        $file = $folders . $file_name;

		saveFile($file_tmp, $file, $conn, $tbl_name, $file_date);
		convertHEIC($file);
	}

	//$handle = fopen('share/log.txt', 'c');
	//fwrite($handle, $file_tmp);
    }
}

