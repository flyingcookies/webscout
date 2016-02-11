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
  when('/scout', {
    templateUrl: '_scout.html',
    controller: 'ScoutCtrl'
  })

});

app.controller('AppCtrl', function($mdSidenav, $scope, $location, $http) {
  $scope.toggleSideNav = function(menuId) {
    $mdSidenav(menuId).toggle();
  };

  $scope.teams = {}
  $scope.lastMatch = 0
  $scope.tournament = {}
  $scope.numMatches = 0
  $scope.matchKeys = []
  $scope.matchKeyTypes = {}
  $scope.numTeams = 0
  $scope.updateTeams = function(){
    $http.get('/data/matchdata.json').success(function(data){
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

    $http.get('/teams.php').success(function(data){
      console.log("Got teams")
      
      data.teams.forEach(function(fileName){
        var number = /\d+/.exec(fileName)[0];
        $http.get('/data/'+fileName).success(function(team){
          console.log("Got team "+number)
          team.number = number;

          if(Object.keys(team.matches).length) {
            for(var matchNum in team.matches)  {
              for(var key in team.matches[matchNum]) {
                var value = team.matches[matchNum][key]

                // check if the value is boolean
                if(value == 'true' || value == 'false')
                  value = value == 'true'
                
                // check if the value is numeric
                else if(/^\d+$/.exec(value)) 
                  value = parseInt(value)

                // check if the value is a string (but glitched by php)
                else if(Object.keys(value).length == 1 && value['0']) {
                  value = value['0']
                }

                team.matches[matchNum][key] = value
              }
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
      })
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
        var average = 0
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

app.controller('ScoutCtrl', function($scope, $location){

});


})();