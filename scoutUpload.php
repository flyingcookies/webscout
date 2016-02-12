<?php

if($_FILES['upload']['error'] == UPLOAD_ERR_OK
      && is_uploaded_file($_FILES['upload']['tmp_name']) || isset($_POST['jsondata'])) {

  // handle posted data differently than uploaded files
  if(isset($_POST['jsondata'])) {
    $filename = $_POST['filename']
    $contents = $_POST['jsondata']

  } else {
    $filename = $_FILES['upload']['name'];
    $contents = file_get_contents($_FILES['upload']['tmp_name']);
    $contents = preg_replace('(<!\\[CDATA\\[|\\]\\]>)', '', $contents);
    $contents = preg_replace('/[\\n\\t]/','', $contents);
  }

  // if it's not json, convert it to json
  if(!isset($_POST["json"]))
    $data = json_encode(simplexml_load_string($contents))

  $data = json_decode($data);
  
  // if it's team data
  if(isset($_POST["team"])) {
    
    // path for file storing team data
    $teamfile = "data/team_".$_POST["team"].".json";

    // empty object for team
    $team = new StdClass();
    // empty object for matches
    $team->matches = new StdClass();

    // the team previously existed
    if(is_file($teamfile)) {
      $team = json_decode(file_get_contents($teamfile));
    }

    // file name is a pit scout file
    if(preg_match('/(?<=^Team )\\d+/', $filename, $isPit)) { // file is pit data
      $team->pit = $data;

      // file name is a match scout file
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