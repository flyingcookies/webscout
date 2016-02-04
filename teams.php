<?php
/*
Get a list of team json files
*/

header("Content-type: application/json");
$teams = scandir("data/");
$teams = array_values(array_diff($teams, array('.', '..')));

echo '{"teams":'.json_encode($teams).'}';

?>