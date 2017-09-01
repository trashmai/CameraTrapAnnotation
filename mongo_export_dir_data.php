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
#$query = json_decode(file_get_contents("php://input"));

// $dir_path = "D:/camera_trap/xampp/htdocs/ct_annotation/images/test/HC";
$dir_path = "D:/.+?/HC";
// for debug
// $query['url'] = 'example001.png';
if (!!@$_GET['dir_path']) {
  // $dir_path = $query->dir_path;
  $dir_path = $_GET['dir_path'];
}

$tmpfname = md5(tempnam("./tmp", "test_")) . ".csv";

// 設定查詢條件
//$queryCondition['tokens']['$elemMatch']['data']['$elemMatch']['value']['$regex'] = $contains;
$queryCondition['dir_path']['$regex'] = str_replace($toEscape, $escaped, $dir_path);
// fields to return
$fl['url'] = 1;
$fl['timestamp'] = 1;
$fl['meta'] = 1;
$fl['date'] = 1;
$fl['time'] = 1;
$fl['dir_path'] = 1;
$fl['tokens.data'] = 1;
$fl['_id'] = 0;

// loading
$cursor = $cdata->find($queryCondition, $fl);

$station = 'spatial_context_1';
$sort_criteria['project_name'] = 1;
$sort_criteria[$station] = 1;
$sort_criteria['project_scope_camera_id'] = 1;
$sort_criteria['url'] = 1;
$sort_criteria['timestamp'] = 1;

$cursor->sort($sort_criteria);
//$cursor = $cdata->aggregate($agg);

// iterate results
$results = array();

// key 值與 js/annImgController.js 中的 standard_data_key 值要相符
$standard_data_key = array('name-vernacular-zhtw', 'sex', 'life-stage', 'idv-char', 'idv-count', 'category-zhtw', 'name-scientific', 'verbatim-behavior-zhtw');
$dummy_data_value = array('NA','NA','NA','NA',1 ,'NA','NA','NA');

// prepare output file
$UTF8_BOM = "\xEF\xBB\xBF";
file_put_contents($tmpfname, $UTF8_BOM);

// 注意與下方的 $tmp_row + $required 的欄位順序
$head = array(
  'Project', 'Station', 'Camera', 'FileName', 'DateTime', 'Species', 'Sex', 'Age', 'ID', 'IdvCount', 'Category', 'SciName', 'Behavior'
);


output($head);


foreach ($cursor as $res) { //照片層級
  $tmp_row = array();

  $tmp_row['project'] = @$res['meta']['project_name'];
  $tmp_row['station'] = @$res['meta'][$station];
  $tmp_row['camera'] = @$res['meta']['project_scope_camera_id'];
  $url_parts = explode("/", $res['url']);
  $tmp_row['filename'] = end($url_parts);
  $tmp_row['datetime'] = $res['date'] . " " . $res['time'];

  if (!empty($res['tokens'])) {
    foreach ($res['tokens'] as $token) { //標註層級，一筆標註算一筆資料
      $row = array();
      $required = array_combine($standard_data_key, $dummy_data_value);
      if (!empty($token['data'])) {
        foreach ($token['data'] as $d) { //資料屬性層級
          if (in_array($d['key'], $standard_data_key)) {
            if ($d['value'] != '') {
              $required[$d['key']] = '"' . str_replace('"', "\\\"", $d['value']) . '"';
            }
          }
        }
      }
      $row = $tmp_row + $required;
      output($row);
    }
  }
  else {
    // 沒標註還是要算一筆空資料
    $row = array();
    $required = array_combine($standard_data_key, $dummy_data_value);  
    $row = $tmp_row + $required;
	  output($row);
  }
}

function output($row) {
  // serializing
  global $tmpfname;
  $sep = ",";
  file_put_contents($tmpfname, implode($sep, $row) . "\n", FILE_APPEND);
}


header("Content-type: text/csv");
header("Content-Disposition: attachment; filename=$tmpfname"); 
readfile($tmpfname);




//if (!$query)
//  var_dump($results);

// return
//echo json_encode(array('query' => $query, 'result' => $results));


?>
