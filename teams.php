<?php
/*
Get a list of team json files
*/

header("Content-type: application/json");

// get a list of team files in the data directory
$teams = glob("data/team_*");
$teams = array_values(array_diff($teams, array('.', '..')));

// remove the 'data/' part of the strings
$teams = array_map(function($team) {
 return str_replace("data/", "", $team) ;
}, $teams);

// output our json
echo '{"teams":'.json_encode($teams).'}';

?>