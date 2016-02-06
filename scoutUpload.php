<?php

if($_FILES['upload']['error'] == UPLOAD_ERR_OK
      && is_uploaded_file($_FILES['upload']['tmp_name'])) {

  $filename = $_FILES['upload']['name'];
  $contents = file_get_contents($_FILES['upload']['tmp_name']);
  $contents = preg_replace('(<!\\[CDATA\\[|\\]\\]>)', '', $contents);
  $contents = preg_replace('/[\\n\\t]/','', $contents);
  $data = json_decode(json_encode(simplexml_load_string($contents)));
  
  if(isset($_POST["team"])) {
    
    $teamfile = "data/team_".$_POST["team"].".json";

    $team = new StdClass();
    $team->matches = new StdClass();

    if(is_file($teamfile)) {
      $team = json_decode(file_get_contents($teamfile));
    }

    if(preg_match('/(?<=^Team )\\d+/', $filename, $isPit)) { // file is pit data
      $team->pit = $data;
    } else if(preg_match('/(?<=^Match )((Quals|Semis|Quarters|Finals) )?\\d+/', $filename, $isMatch)) { //file is match data
      $num = $isMatch[0];
      $team->matches->$num = $data;
    }
    file_put_contents($teamfile, json_encode($team));
    echo "1";

  } else if(isset($_POST["match"])) {
    file_put_contents("data/matchdata.json", json_encode($data));
    echo "1";
  } else {
    echo "0";
  }


} else {
  echo "0";
}
?>