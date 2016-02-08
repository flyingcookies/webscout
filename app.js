(function(){


var app = angular.module('app', ['ngRoute', 'ngMaterial']);

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
          $scope.teams[number] = team;
          
          var lastMatch = parseInt(Object.keys(team.matches).sort().reverse()[0] || 0)
          if(lastMatch > $scope.lastMatch) {
            $scope.lastMatch = lastMatch
          }

          $scope.$broadcast('updateTeams')
        })
      })
    })
  }

  $scope.getLastMatch = function() {
    var matchData = []
    for(var number in $scope.teams) {     
      var team = $scope.teams[number]
      var match = team.matches[$scope.lastMatch];
      if(match) {
        matchData.push({'team': number})
      }
    }
    return matchData
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

});

app.controller('TeamCtrl', function($scope, $location){

});

})();