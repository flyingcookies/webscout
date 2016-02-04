<?php

if($_FILES['upload']['error'] == UPLOAD_ERR_OK
      && is_uploaded_file($_FILES['upload']['tmp_name'])
      && isset($_POST["team"])) {

  $teamfile = "data/team_".$_POST["team"].".json";
  $filename = $_FILES['upload']['name'];

  $team = new StdClass();
  $team->matches = new StdClass();

  if(is_file($teamfile)) {
    $team = json_decode(file_get_contents($teamfile));
  }

  $contents = file_get_contents($_FILES['upload']['tmp_name']);
  $contents = preg_replace('/[\\n\\t]/','', $contents);
  $data = json_decode(json_encode(simplexml_load_string($contents)));

  if(preg_match('/(?<=^Team )\\d+/', $filename, $isPit)) { // file is pit data
    $team->pit = $data;
  } else if(preg_match('/(?<=^Match )\\d+/', $filename, $isMatch)) { //file is match data
    $num = $isMatch[0];
    $team->matches->$num = $data;
  }
  file_put_contents($teamfile, json_encode($team));
  echo "1";

} else {
  echo "0";
}
?>