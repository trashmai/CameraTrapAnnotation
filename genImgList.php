<?php

date_default_timezone_set('Asia/Taipei');

include "db_config.php";
require_once realpath(__DIR__) . "/libraries/getID3/src/getid3.php";
$getID3 = new getID3;

$settings_tmp = json_decode(file_get_contents("settings.json"));

$sys_encoding = 'UTF-8';
if ($settings_tmp->os_type == 'windows') {
	$sys_encoding = 'BIG5'; //WTF
}

$settings = $settings_tmp->{$settings_tmp->os_type};

$utf8toSysEncodingMap = array();

function getImgMeta ($fn, $dir_path) {
	global $getID3, $settings, $sys_encoding, $utf8toSysEncodingMap;

	if (!preg_match('/\.(jpg|jpeg|png)$/i', $fn)) {
		return null;
	}

	$meta = $getID3->analyze($fn);

	//var_dump($meta);

	$fileformat = $meta['fileformat'];
	$exif = $meta[$fileformat]['exif']['EXIF'];

	// don't want this
	// $dt = $meta[$fileformat]['exif']['FILE']['FileDateTime'];
	// echo date('Y-m-d\TH:i:s', $dt) . "\n";

	// want this
	if (isset($exif['DateTimeOriginal'])) {
		$datetime = $exif['DateTimeOriginal'];
	}
	else if (isset($meta['xmp']['xmp']['CreateDate'])) {
		$datetime = $meta['xmp']['xmp']['CreateDate'];
        }
	else {
		var_dump($meta);
	}
	// echo $datetime . "\n";

	$realpath_fn = str_replace("\\", "/", realpath($fn));


	$relative_path = str_replace($settings->images_base_path, "", $fn);
	$web_images_full_path = rtrim($settings->web_base_path, "/") . $relative_path;

	$dir_path_utf8 = iconv($sys_encoding, 'UTF-8//IGNORE', $dir_path);
	$utf8toSysEncodingMap[$dir_path_utf8] = $dir_path;

	return array (
		'file' => iconv($sys_encoding, 'UTF-8//IGNORE', $web_images_full_path),
		'timestamp' => strtotime($datetime),
		'dir_path' => $dir_path_utf8,
	);
}

function cmp ($a, $b) {
	if (!isset($a['timestamp']) || !isset($b['timestamp'])) {
		return false;
	}

	if ($a['timestamp'] < $b['timestamp']) {
		return -1;
	}
	else if ($a['timestamp'] > $b['timestamp']) {
		return 1;
	}
	else if ($a['file'] < $b['file']) {
		return -1;
	}
	else if ($a['file'] > $b['file']) {
		return 1;
	}
	return 0;
}

$dir_data = array();
function dir_callback_sortByTS ($files, $data) {
	global $dir_data;
	usort($data, 'cmp');
	$dir_data[] = $data;
}

//$dir_idx = array();
function listFolder($path, $pattern='/*', $file_callback = 'var_dump', $dir_callback = NULL) {

	//global $dir_idx;
	$ret = true;

	$path = str_replace("\\", "/", realpath($path));

	//if (empty($dir_idx)) {
	//	$dir_idx[$path] = 0;
	//}

	echo $path . "\n";
	$rets = array();

	$items = glob($path . $pattern);
	$files = array();
	//var_dump($items);
	foreach ($items as $file) {
		// var_dump($ret);
		if ($ret === false) break;
		if (is_dir($file) && ($path != $file)) {

			//if (!isset($dir_idx[$file])) {
			//	$dir_idx[$file] = count($dir_idx);
			//}
			//Display a list of sub folders.
			listFolder($file, $pattern, $file_callback, $dir_callback);
		}
		else {
			$files[] = $file;
			//Display a list of files.
			if (!is_null($file_callback) && function_exists($file_callback)) {
				// $ret = call_user_func($file_callback, $file, $dir_idx[$path]);
				$ret = call_user_func($file_callback, $file, $path);
				if ($ret !== false && $ret !== null) {
					$rets[] = $ret;
				}
			}
		}
	}

	//closing the directory
	if (!is_null($dir_callback) && function_exists($dir_callback)) {
		call_user_func($dir_callback, $files, $rets);
	}

}

function level_one_flatten ($carry, $item) {
	return array_merge($carry, $item);
}


if (empty($argv[1])) {
	echo "Please provide a directory path as argument.\n";
	return;
}

$path = rtrim($argv[1], "\\/");

if (is_dir($path)) {

	$image_category_file = 'image_list_ct.json';
	$dir_category_file = 'dir_list_ct.json';

	listFolder($argv[1], '/*', 'getImgMeta', 'dir_callback_sortByTS');

	// var_dump($dir_data);

	$dirs = array();

	foreach ($dir_data as $dd) {
		if (count($dd) > 0) {
			$sysEncodingDirPath = $utf8toSysEncodingMap[$dd[0]['dir_path']];
			file_put_contents($sysEncodingDirPath . "/" . $image_category_file, json_encode($dd));
			echo $sysEncodingDirPath . "/" . $image_category_file . "\n";
			$dirs[] = $dd[0]['dir_path'];
		}
	}
	//var_dump($dirs);
	file_put_contents($dir_category_file, json_encode($dirs));

	$res = array_reduce($dir_data, 'level_one_flatten', array());
	// var_dump($res);

	$output = $res;

	file_put_contents("image_list_ct.json", json_encode($output));

	foreach ($res as $idx => $r) {
		$toSave[$idx]['$set']['date'] = date("Y-m-d", $r['timestamp']);
		$toSave[$idx]['$set']['time'] = date("H:i:s", $r['timestamp']);
		$toSave[$idx]['$set']['timestamp'] = $r['timestamp'];
		$toSave[$idx]['$set']['dir_path'] = $r['dir_path'];
		//$toSave[$idx]['$set']['dir_path'] = iconv($sys_encoding, 'UTF-8//IGNORE', $r['dir_path']);
		$toSave[$idx]['$set']['url'] = $r['file'];
		//$toSave[$idx]['$set']['url'] = iconv($sys_encoding, 'UTF-8//IGNORE', $r['file']);
	}

	mongo_save($toSave);

}
else {
	echo "Please enter a DIRECTORY path\n";
}

function mongo_save ($data) {

	// MongoDB 伺服器設定
	global $dbhost, $dbname;
	
	// 連線到 MongoDB 伺服器
	$mongoClient = new MongoClient('mongodb://' . $dbhost);
	$db = $mongoClient->$dbname;


	// 取得 demo 這個 collection
	// $cmeta = $db->local_meta;
	$cdata = $db->local_data;

	$cnt = count($data) - 1;

	foreach ($data as $idx => $d) {

		if ($cnt == 0) {
			$percent = 100;
		}
		else {
			$percent = round(100.0 * $idx / $cnt, 1);
		}
		echo $percent . "%  \r";

		$queryCondition['url'] = $d['$set']['url'];

		// update options
		$update_options['upsert'] = true;
		$update_options['multiple'] = true;

		// 將資料upsert至 test 這個 collection 中
		$cdata->update($queryCondition, $d, $update_options);
	}

	$cdata->ensureIndex(array('url' => 1), array('unique' => true));
	echo "\n";
}
