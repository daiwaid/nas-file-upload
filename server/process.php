<?php 

header("Access-Control-Allow-Origin: *");

function saveFile($tmp_path, $path, $file_date=-1, $number=0) {	
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
	// check if contents are different
        if (filesize($tmp_path) == filesize($new_path)) {
  	    $ah = fopen($tmp_path, 'rb');
  	    $bh = fopen($new_path, 'rb');

	    $same = TRUE;
  	    while(!feof($ah)) {
    	        if(fread($ah, 8192) != fread($bh, 8192)) {
      	   	    $same = FALSE;
		    break;
		}
	    }
	    fclose($ah);
	    fclose($bh);
	    if ($same) {
		return;
	    }
	}
	saveFile($tmp_path, $path, $file_date, $number+1);
	return;
    }

    move_uploaded_file($tmp_path, $new_path);
    if ($file_date > 0) {
	touch($path, $file_date);
    }
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

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_FILES['files'])) {
	$errors = [];
	$path = '/var/share/lan-drive/';
	$subfolders = 'uncategorized/';
        $extensions = ['txt', 'jpg', 'jpeg', 'png', 'gif', 'HEIC'];

        $all_files = count($_FILES['files']['tmp_name']);

	for ($i = 0; $i < $all_files; $i++) {
	
            $file_name = $_FILES['files']['name'][$i];
            $file_tmp = $_FILES['files']['tmp_name'][$i];
            $file_type = $_FILES['files']['type'][$i];
	    $file_size = $_FILES['files']['size'][$i];
	    $file_ext = pathinfo($file_name, PATHINFO_EXTENSION);

 	    /*if (!in_array($file_ext, $extensions)) {
                $errors[] = 'Extension not allowed: ' . $file_name . ' ' . $file_type;
	    }*/

            if ($file_size > 5000000000) {
                $errors[] = 'File size exceeds limit: ' . $file_name . ' ' . $file_type;
	    }

	    $file_date = findDate($file_tmp);
	    if ($file_date > 0) {
		$file_datetime = new DateTime();
		$file_datetime->setTimestamp($file_date);
		$subfolders = $file_datetime->format('Y') . '/' . $file_datetime->format('Y-n') . '/';
	    }
	    $folders = $path . $subfolders;
	    if (!file_exists($folders)) {
	    	mkdir($folders, 0775, true);
	    }
            $file = $folders . $file_name;

            if (empty($errors)) {
		saveFile($file_tmp, $file, $file_date);
            }
	}

        if ($errors) print_r($errors);

	//$handle = fopen('share/log.txt', 'c');
	//fwrite($handle, $file_tmp);
    }
}

