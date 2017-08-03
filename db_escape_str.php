<?php
$chars_to_escape = '.*+?^${}()|[]\\/';
$toEscape = str_split($chars_to_escape);

foreach($toEscape as $c) {
	$escaped[] = '\\' . $c;
}

#var_dump($toEscape);
#var_dump($escape);
