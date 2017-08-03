<?php

include "db_config.php";
include "db_escape_str.php";
// 要儲存的資料
// $data = json_decode(file_get_contents("php://input"));

$settings_json = file_get_contents('settings.json');
$settings = json_decode($settings_json);

$from_local = $settings->{$settings->os_type}->images_base_path;
$from_web = $settings->{$settings->os_type}->web_base_path;

$type = $argv[1]; //options: local, web
$from = $argv[2];
$replacement = $argv[3];

if (empty($type) || empty($from) || empty($replacement)) {
	echo 'Example:' . "\n";
	echo 'php change_images_base_path.php local "$from" "$replacement"' . "\n";
	echo 'php change_images_base_path.php web "$from" "$replacement"' . "\n";
	echo $settings_json . "\n";
	return;
}

switch ($type) {
	case 'local':
		$field = 'dir';
		$from_type = $from_local;
		$from_field = 'images_base_path';
		break;
	case 'web':
		$field = 'url';
		$from_type = $from_web;
		$from_field = 'web_base_path';
		break;
	default:
		echo "Type can only be 'local' or 'web'\n";
		echo 'Example:' . "\n";
		echo 'php change_images_base_path.php local "$from" "$replacement"' . "\n";
		echo 'php change_images_base_path.php web "$from" "$replacement"' . "\n";
		echo $settings_json . "\n";
		return;
}

$replacement = str_replace($from, $replacement, $from_type); // e.g. mydomain.example.org
$replacement = str_replace("\\", '/', $replacement);


$from_type = str_replace($toEscape, $escaped, $from_type);

$regex = '$regex';
$mongo_script = "db.local_data.find({ url: { $regex: /".$from_type."/i } }).forEach(function(e) {
    e.url = e.url.replace(/".$from_type."/i, '$replacement');
    db.local_data.save(e);
});";

echo "---------RUNNING----------\n";
echo $mongo_script . "\n";

$settings->{$settings->os_type}->{$from_field} = $replacement;

$settings_json = json_encode($settings, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
echo "-----SETTINGS UPDATED-----\n";
echo $settings_json . "\n";

file_put_contents("settings.json", $settings_json);
// 連線到 MongoDB 伺服器
$mongoClient = new MongoClient('mongodb://' . $dbhost);
$db = $mongoClient->$dbname;
$db->execute($mongo_script);

?>
