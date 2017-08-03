<?php
// MongoDB 伺服器設定
include "db_config.php";
include "db_escape_str.php";

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
  $contains = $query->contains;
}
else {
  $contains = ".*";
}

// 設定查詢條件
//$queryCondition['tokens']['$elemMatch']['data']['$elemMatch']['value']['$regex'] = $contains;
if (!empty($contains)) {
  $queryCondition['$or'][0]['tokens.data.value']['$regex'] = str_replace($toEscape, $escaped, $contains);
  //$queryCondition['$or'][1]['tokens.description_level']['$regex'] = $contains;
}
else {
  $queryCondition['$or'][0]['tokens.data.value']['$regex'] = '.*';
}
// fields to return
$fl['url'] = 1;
$fl['timestamp'] = 1;
$fl['dir_path'] = 1;
$fl['_id'] = 0;

// loading
$cursor = $cdata->find($queryCondition, $fl);
$cursor->sort(array('url' => 1, 'timestamp' => 1));
//$cursor = $cdata->aggregate($agg);

// iterate results
$results = array();

foreach ($cursor as $res) {
	$tmp_res = array();
	$tmp_res['file'] = $res['url'];
	$tmp_res['dir_path'] = $res['dir_path'];
	$tmp_res['timestamp'] = $res['timestamp'];
	array_push($results, $tmp_res);
}

if (!$query)
  var_dump($results);

// return
echo json_encode(array('query' => $query, 'result' => $results));


?>
