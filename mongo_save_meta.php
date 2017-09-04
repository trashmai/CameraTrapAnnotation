<?php

include "db_config.php";
include "db_escape_str.php";
// 要儲存的資料
// $data = json_decode(file_get_contents("php://input"));
$post = json_decode(file_get_contents("php://input"));

$field = $post->field;
$value = $post->value;
$meta = $post->meta;
$sessionId = $post->sessionId;

$ret = mongo_save($meta, $field, $value);

$ret_json = json_encode($ret);

echo $ret_json;

// This is our new stuff
$context = new ZMQContext();
$socket = $context->getSocket(ZMQ::SOCKET_PUSH, 'metadata updated pusher');
$socket->connect("tcp://localhost:5555");
$socket->send($ret_json);


function mongo_save ($meta, $field, $value) {

	global $dbhost, $dbname, $toEscape, $escaped, $sessionId;

	$toUpdate['meta'] = $meta;

	// MongoDB 伺服器設定
	
	// 連線到 MongoDB 伺服器
	$mongoClient = new MongoClient('mongodb://' . $dbhost);
	$db = $mongoClient->$dbname;
	
	// 取得 demo 這個 collection
	$cdata = $db->local_data;

	//$queryCondition[$field]['$regex'] = str_replace($toEscape, $escaped, $value);
	$queryCondition[$field] = $value;

	// update options
	$update_options['upsert'] = true;
	$update_options['multiple'] = true;

	// 將資料upsert至 test 這個 collection 中
	$res = $cdata->update($queryCondition, array('$set' => $toUpdate), $update_options);

    return array('queryCondition' => $queryCondition, 'data' => array('$set' => $toUpdate), 'res' => $res, 'sessionId' => $sessionId);

}

?>
