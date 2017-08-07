<?php
// MongoDB 伺服器設定
include "db_config.php";

// 連線到 MongoDB 伺服器
$mongoClient = new MongoClient('mongodb://' . $dbhost);
$db = $mongoClient->$dbname;

// 取得 demo 這個 collection
$cmeta = $db->local_meta;
$cdata = $db->local_data;

// 要儲存的資料
// $data = json_decode(file_get_contents("php://input"));
$post = json_decode(file_get_contents("php://input"));

$batch = $post->batch;
$data = $post->data;
$sessionId = $post->sessionId;

$toSave = array();
if ($batch == 1) {
	$toSave = $data;
}
else {
	$toSave[] = $data;
}

$ret = array();
foreach ($toSave as $d) {
	$ret[] = save($d);
}

$ret_json = json_encode($ret);
echo $ret_json;

// This is our new stuff
$context = new ZMQContext();
$socket = $context->getSocket(ZMQ::SOCKET_PUSH, 'data updated pusher');
$socket->connect("tcp://localhost:5555");
$socket->send($ret_json);


function save ($data) {
	global $cdata, $cmeta, $sessionId;
	// 設定查詢條件
	$queryCondition['url'] = $data->url;

	/*
	$meta['meta'] = $data->meta;
	$meta['date'] = $data->date;
	$meta['time'] = $data->time;
	$meta['timestamp'] = $data->timestamp;
	$meta['dir_path'] = $data->dir_path;
	$meta['url'] = $data->url;
	unset($data->meta);
	unset($data->date);
	unset($data->time);
	unset($data->timestamp);
	unset($data->dir_path);
	*/

	// update options
	$update_options['upsert'] = true;
	// $update_options['multiple'] = true;

	// 將資料upsert至 test 這個 collection 中
	$cdata->update($queryCondition, array('$set' => $data), $update_options);
	//$cmeta->update($queryCondition, $meta, $update_options);

	return array('criteria'=>$queryCondition, 'data' => $data, 'meta' => null, 'options' => $update_options, 'sessionId' => $sessionId);
}


?>
