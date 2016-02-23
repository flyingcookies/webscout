function cleanValues(hash) {
  delete hash['@attributes']

  for(var key in hash) {
    var value = hash[key]

    // check if the value is boolean
    if(value == 'true' || value == 'false')
      value = value == 'true'
    
    // check if the value is numeric
    else if(/^\d+$/.exec(value)) 
      value = parseInt(value)

    // check if the value is a string (but glitched by php)
    else if(typeof value == 'object' && Object.keys(value).length == 1 && value['0']) {
      value = value['0']
    } else if(typeof value == 'object') {
      value = cleanValues(value)
    }

    hash[key] = value
  }
  return hash
}

(function(){


var app = angular.module('app', ['ngRoute', 'ngMaterial', 'googlechart']);

app.config(function($routeProvider, $mdThemingProvider){

  $mdThemingProvider.theme('default').
    primaryPalette('indigo', {
      'default': '500',
      'hue-1': '50'
    }).accentPalette('red', {
      'default': '700'
    })

  $mdThemingProvider.setDefaultTheme('default')

  $routeProvider.
  when('/', {
    redirectTo: '/overview'
  }).
  when('/overview',{
    templateUrl: '_overview.html',
    controller: 'OverviewCtrl'
  }).
  when('/team/:id', {
    templateUrl: '_team.html',
    controller: 'TeamCtrl'
  }).
  when('/scout/pit', {
    templateUrl: '_pitscout.html',
    controller: 'ScoutCtrl'
  }).
  when('/scout/match', {
    templateUrl: '_matchscout.html',
    controller: 'ScoutCtrl'
  }).
  when('/editmatch', {
    templateUrl: '_editmatch.html',
    controller: 'EditCtrl'
  }).
  when('/scout', { redirectTo: '/scout/match'}).
  otherwise({ redirectTo: '/overview' })

});

app.filter('sortMatches', function(){
  return function(items){
    var filtered = []
    var order = ['Quals', 'Quarters', 'Semis', 'Finals']
    var keys = Object.keys(items)
    keys.sort(function(a, b) {
      var titleA = a.split(' ')
      var titleB = b.split(' ')
      if(titleA[0] == titleB[0]) {
        return parseInt(titleA[1]) - parseInt(titleB[1])
      }
      return order.indexOf(titleA[0]) - order.indexOf(titleB[0])
    })
    return keys.map(function(k){return items[k]})
  }
});

app.controller('AppCtrl', function($mdSidenav, $scope, $location, $http) {
  $scope.toggleSideNav = function(menuId) {
    $mdSidenav(menuId).toggle();
  };

  $scope.menu = [
    {
        title: 'Overview',
        icon: 'dashboard',
        path: '/overview'
    },
    {
        title: 'Pit Scout',
        icon: 'create',
        path: '/scout/pit'
    },
    {
        title: 'Match Scout',
        icon: 'add',
        path: '/scout/match'
    },
    {
        title: 'Edit Match',
        icon: 'assignment',
        path: '/editmatch'
    }
  ];

  $scope.setPath = function(path) {
      $location.path(path)
  }

  $scope.teams = {}
  $scope.lastMatch = 0
  $scope.tournament = {}
  $scope.numMatches = 0
  $scope.matchKeys = []
  $scope.matchKeyTypes = {}
  $scope.numTeams = 0
  $scope.updateTeams = function(){

    $http.get('data/matchdata.json').success(function(data){
      $scope.tournament = data
      $scope.tournament.matches = {}
      $scope.tournament.teams = {}

      data.channel.item.forEach(function(match){
        var redScore = match.description.h1[0]
        var blueScore = match.description.h1[1]

        var scoreRegex = /\d+$/
        redScore = parseInt(scoreRegex.exec(redScore)[0])
        blueScore = parseInt(scoreRegex.exec(blueScore)[0])
        match.description.h1 = [redScore, blueScore]
        match.type = match.title.split(' ')[0]

        for(var i in match.description.li) {
          // team number
          var number = match.description.li[i]
          if(!$scope.tournament.teams[number]) {
            $scope.tournament.teams[number] = {
              number: number,
              matches: {}
            }
          }

          $scope.tournament
            .teams[number]
            .matches[match.title] = {
              score: (i < 3 ? redScore : blueScore)
            }
          $scope.tournament.matches[match.title] = match
        }
      })

      $scope.numMatches = Object.keys($scope.tournament.matches).length
      $scope.numTeams = Object.keys($scope.tournament.teams).length
    })

    $http.get('teams.php').success(function(data){

      console.log("Got teams")
      
      data.teams.forEach($scope.handleTeam)
    })
  }

  $scope.handleTeam = function(fileName){
    var number = /\d+/.exec(fileName)[0];
    $http.get('data/'+fileName).success(function(team){
      console.log("Got team "+number)
      team.number = number;
      if(team.pit) {
        console.log('has pit')
        team.pit = cleanValues(team.pit)

      }

      if(Object.keys(team.matches).length) {
        for(var matchNum in team.matches)  {
          team.matches[matchNum] = cleanValues(team.matches[matchNum])
        }

        if(!$scope.matchKeys.length && Object.keys(team.matches).length) {
          var firstMatch = Object.keys(team.matches)[0]
          $scope.matchKeys = Object.keys(team.matches[firstMatch])
          $scope.matchKeys.splice(0, 1)
          for(var i in $scope.matchKeys) {
            var key = $scope.matchKeys[i]
            console.log(key, "is", typeof team.matches[firstMatch][key])
            $scope.matchKeyTypes[key] = typeof team.matches[firstMatch][key]
          }
        }

        var lastMatch = parseInt(Object.keys(team.matches).sort().reverse()[0] || 0)
        if(lastMatch > $scope.lastMatch) {
          $scope.lastMatch = lastMatch
        }
      }

      $scope.teams[number] = team;
      $scope.$broadcast('updateTeams')
    })
  }

  $scope.getLastMatch = function() {
    var matchData = []
    for(var number in $scope.teams) {     
      var team = $scope.teams[number]
      if(!Object.keys(team.matches).length) 
        continue;

      var match = team.matches[$scope.lastMatch];
      if(match) {
        matchData.push({'team': number})
      }
    }
    return matchData
  }

  $scope.getStats = function(team, attr) {
    var type = $scope.matchKeyTypes[attr]
    if(!$scope.teams[team])
      return ['N/A']
    var matches = $scope.teams[team].matches

    switch(type) {
      case 'string':
        break;
      case 'number':
        var total = 0
        for(var num in matches) {
          total += matches[num][attr]
        }
        return [total, total / Object.keys(matches).length]
      case 'boolean':
        var successes = 0
        for(var num in matches) {
          if(matches[num][attr])
            successes ++
        }
        return [successes / Object.keys(matches).length]
      default:
        return ['N/A']
    }
  }

  $scope.updateTeams();

});


app.controller('OverviewCtrl', function($scope, $location) {

  $scope.lastMatchData = []
  $scope.numScoutedTeams = 0

  $scope.updateMatchData = function() {
    $scope.lastMatchData = $scope.getLastMatch()
    $scope.numScoutedTeams = Object.keys($scope.teams).length
    console.log('updated')
  }

  $scope.$on('updateTeams', $scope.updateMatchData)
  if(!$scope.lastMatchData.length) {
    $scope.updateMatchData();
  }

  $scope.pie = {
    type: 'PieChart'
  }

  $scope.pie.data = {"cols": [
        {id: "t", label: "Topping", type: "string"},
        {id: "s", label: "Slices", type: "number"}
    ], "rows": [
        {c: [
            {v: "Mushrooms"},
            {v: 3},
        ]},
        {c: [
            {v: "Olives"},
            {v: 31}
        ]},
        {c: [
            {v: "Zucchini"},
            {v: 1},
        ]},
        {c: [
            {v: "Pepperoni"},
            {v: 2},
        ]}
    ]};

    $scope.pie.options = {
        'legend': 'none'
    };

});

app.controller('TeamCtrl', function($scope, $routeParams, $location){
  console.log($routeParams.id)
  $scope.teamNumber = $routeParams.id
});


app.controller('EditCtrl', function($scope, $location){
  $scope.addRow = function(){

  };

  $scope.editNewMatchType = function(){


  };

  $scope.editMatchType = function(match, item){
    var previousTitle = match.title;
    var matchnum = 1;
    for(;$scope.tournament.matches[item + ' ' + matchnum]; matchnum++){}
    match.title = item + ' ' + matchnum;

    delete $scope.tournament.matches[previousTitle];
    $scope.tournament.matches[match.title] = match;

  };


  $scope.moveUp = function(match){
    var keys = Object.keys($scope.tournament.matches)
    var index = keys.indexOf(match.title)
    if(index == 0)
      return;

    var previous = keys[index-1]
    var previousMatch = $scope.tournament.matches[previous]
    $scope.tournament.matches[match.title] = previousMatch
    $scope.tournament.matches[previous] = match
    previousMatch.title = match.title
    match.title = previous
  };
});

app.controller('ScoutCtrl', function($scope, $location, $http){
  $scope.scout = {}
  
  $scope.scoutMeta = {
      teamNumber: {
        type: 'string',
        name: 'Team Number'
      },
      teamName: {
        type: 'string',
        name: 'Team Name'
      },
      driveType: {
        type: 'string',
        name: 'Drive Type'
      },
      wheelType: {
        type: 'string',
        name: 'Wheel Type'
      },
      wheelNumber: {
        type: 'number',
        name: 'Number of Wheels'
      },
      cimNumber: {
        type: 'number',
        name: 'Number of CIMs'
      },
      maxSpeed: {
        type: 'string',
        name: 'Max Speed'
      },
      comment: {
        type: 'string',
        name: 'Additional Comments'
      },
      port: {
        type: 'boolean',
        name: 'Porticullus (Gate)'
      },
      cheval: {
        type: 'boolean',
        name: 'Cheval de Frize (Tilting)'
      },
      moat: {
        type: 'boolean',
        name: 'Moat'
      },
      ramp: {
        type: 'boolean',
        name: 'Ramparts'
      },
      draw: {
        type: 'boolean',
        name: 'Drawbridge'
      },
      sally: {
        type: 'boolean',
        name: 'Sally Port'
      },
      rock: {
        type: 'boolean',
        name: 'Rock Wall'
      },
      rough: {
        type: 'boolean',
        name: 'Rough Terrain'
      },
      functional: {
        type: 'boolean',
        name: 'Functional'
      },
      startWithBall: {
        type: 'boolean',
        name: 'Starts with Ball'
      },
      autoSpy: {
        type: 'boolean',
        name: 'Autonomous Spy'
      },
      shootBall: {
        type: 'boolean',
        name: 'Can Shoot Balls'
      },
      grabBall: {
        type: 'boolean',
        name: 'Can Grab Balls'
      },
      canLift: {
        type: 'boolean',
        name: 'Can Lift'
      },
      defensePicked: {
        type: 'radio',
        name: 'Defense Picked',
        options: {
          "port": "Porticullus",
          "cheval": "Cheval de Frize", 
          "moat": "Moat",
          "ramp": "Ramparts",
          "draw": "Drawbridge",
          "sally": "Sally Port",
          "rock": "Rock Wall",
          "rough": "Rough Terrain"
        }
      },
      placement: {
        type: 'image',
        options: {
          src: 'halffield.png'
        },
        name: 'Robot Placement'
      },
      startWithBall: {
        type: 'boolean',
        name: 'Starts With Ball'
      },
      autoSpy: {
        type: 'boolean',
        name: 'Spy Zone'
      },
      noMove: {
        type: 'boolean',
        name: "Robot Doesn't Move"
      },
      autoZone: {
        type: 'boolean',
        name: 'Robot in Auto Zone'
      },
      defenses: {
        type: 'defense',
        name: 'Defenses',
        options: {
          "port": "Porticullus",
          "cheval": "Cheval de Frize", 
          "moat": "Moat",
          "ramp": "Ramparts",
          "draw": "Drawbridge",
          "sally": "Sally Port",
          "rock": "Rock Wall",
          "rough": "Rough Terrain"
        }
      },
      shots: {
        type: 'multi',
      },
      lift: {
        type: 'boolean',
        name: 'Ends on Lift'
      },
      base: {
        type: 'boolean',
        name: 'Ends on Base'
      }
  }

  $scope.type = 'match'
  if($location.url() == '/scout/pit') {
    $scope.type = 'pit'
    $scope.scout = {
      main: {
        teamNumber: '',
        teamName: '',
        driveType: '',
        wheelType: '',
        wheelNumber: 4,
        cimNumber: 2,
        maxSpeed: '',
        comment: ''
      },
      defenses: {
        port: false,
        cheval: false,
        moat: false,
        ramp: false,
        draw: false,
        sally: false,
        rock: false,
        rough: false,
        comment: ''
      },
      auto: {
        functional: false,
        startWithBall: false,
        autoSpy: false,
        comment: ''
      },
      abilities: {
        shootBall: false,
        grabBall: false,
        canLift: false,
        comment: ''
      }
    }
  } else {
    $scope.scout = {
      pregame: {
        defensePicked: '',
        placement: ''
      },
      autonomous: {
        startWithBall: false,
        autoSpy: false,
        noMove: false,
        autoZone: false
      },
      teleop: {
        noMove: false,
        defenses: {
          "port": 0,
          "cheval": 0, 
          "moat": 0,
          "ramp": 0,
          "draw": 0,
          "sally": 0,
          "rock": 0,
          "rough": 0
        },
        shots: []
      },
      endgame: {
        lift: false,
        base: false
      }

    }
  }

  $scope.submit = function() {
    var data = $scope.scout
    var teamNumber = data.main && data.main.teamNumber || $scope.teamNumber;
    console.log("team: "+teamNumber)
    var filename = 'Team '+teamNumber;
    if($scope.type != 'pit') {
      filename = 'Match '+$scope.matchNum;
    }
    $http({
      url: 'scoutUpload.php',
      method: 'GET',
      params: {
        json: data,
        team: teamNumber,
        filename: filename
      }
    }).success(function(data){
      console.log(data)
      $scope.handleTeam('team_'+teamNumber+'.json')
      $location.path('/team/'+teamNumber)
    }).error(function(err){
      console.log(err)
    })
  }

  $scope.handleImageInput = function($event) {
    var element = $event.srcElement
    var x = event.offsetX / element.clientWidth
    var y = event.offsetY / element.clientHeight
    var cursor = element.parentNode.querySelector('.cursor');
    cursor.style.left = (element.x + event.offsetX)+'px'
    cursor.style.top = (element.y + event.offsetY)+'px'
    console.log(event, element.offsetTop, cursor.style.top)
    //console.log(element.parentNode.querySelector('.cursor'))
    console.log(Math.floor(x*1000)/10, Math.floor(y*1000)/10)
  }

});


})();
