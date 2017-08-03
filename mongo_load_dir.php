<?php
// MongoDB 伺服器設定
include "db_config.php";

// 連線到 MongoDB 伺服器
$mongoClient = new MongoClient('mongodb://' . $dbhost);
$db = $mongoClient->$dbname;

// 取得 demo 這個 collection
$cdata = $db->local_data;

// 要load的criteria, image url
$query = json_decode(file_get_contents("php://input"));

// for debug
// $query['url'] = 'example001.png';
if (!!$query) {
  $dir_path = $query->dir_path;
}

// 設定查詢條件
//$queryCondition['tokens']['$elemMatch']['data']['$elemMatch']['value']['$regex'] = $contains;
$queryCondition['dir_path'] = $dir_path;
// fields to return
$fl['url'] = 1;
$fl['timestamp'] = 1;
$fl['dir_path'] = 1;
$fl['tokens.data'] = 1;
$fl['_id'] = 0;

// loading
$cursor = $cdata->find($queryCondition, $fl);
$cursor->sort(array('url' => 1, 'timestamp' => 1));
//$cursor = $cdata->aggregate($agg);

// iterate results
$results = array();

foreach ($cursor as $res) {
	$results[$res['url']] = $res;
}

if (!$query)
  var_dump($results);

// return
echo json_encode(array('query' => $query, 'result' => $results));


?>
