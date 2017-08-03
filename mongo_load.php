<?php
// MongoDB 伺服器設定
include "db_config.php";

// 連線到 MongoDB 伺服器
$mongoClient = new MongoClient('mongodb://' . $dbhost);
$db = $mongoClient->$dbname;

// 取得 demo 這個 collection
#$cmeta = $db->local_meta;
$cdata = $db->local_data;

// 要load的criteria, image url
$query = json_decode(file_get_contents("php://input"));

// for debug
// $query['url'] = 'example001.png';


$url = $query->url;

// 設定查詢條件
if (preg_match('/\.fbcdn\.net/', $url)) {
	$parts = explode('?', $url, 2);
	$base_url = $parts[0];
        $parts = explode(".fbcdn.net", $base_url, 2);
	$id_url = '\.fbcdn\.net' . $parts[1];
	$queryCondition['url']['$regex'] = $id_url;
}
else {
	$queryCondition['url'] = $url;
}


// loading
$res = $cdata->findOne($queryCondition);
//$meta = $cmeta->findOne($queryCondition);

$tresult['meta'] = @$res['meta'];
$tresult['date'] = @$res['date'];
$tresult['time'] = @$res['time'];
$tresult['dir_path'] = @$res['dir_path'];
$tresult['timestamp'] = @$res['timestamp'];

unset($res['_id']);
unset($res['url']);
unset($res['meta']);
unset($res['date']);
unset($res['time']);
unset($res['dir_path']);
unset($res['timestamp']);

if (empty($res)) {
	$result = json_decode(file_get_contents("annotation.empty.json"));
	$result = (array) $result;
}
else {
	$result = (array) $res;
}

//$meta = (array) $meta;
//$tresult['meta'] = $meta['meta'];
//$tresult['date'] = $meta['date'];
//$tresult['time'] = $meta['time'];
//$tresult['dir_path'] = $meta['dir_path'];
//$tresult['timestamp'] = $meta['timestamp'];

$result['url'] = $url;
$result['meta'] = @$tresult['meta'];
$result['date'] = @$tresult['date'];
$result['time'] = @$tresult['time'];
$result['dir_path'] = @$tresult['dir_path'];
$result['timestamp'] = @$tresult['timestamp'];


// return
echo json_encode(array('query' => $query, 'result' => $result, 'conditions' => $queryCondition, 'res' => $res, 'meta' => null));

?>
