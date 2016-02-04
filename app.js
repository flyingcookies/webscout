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
  $scope.updateTeams = function(){
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

  $scope.updateTeams();

});


app.controller('OverviewCtrl', function($scope, $location) {

  $scope.lastMatchData = []
  $scope.numTeams = 0

  $scope.$on('updateTeams', function() {
    $scope.lastMatchData = $scope.getLastMatch()
    $scope.numTeams = Object.keys($scope.teams).length
    console.log('updated')
  })

  $scope.getLastMatch = function() {
    var matchData = []
    for(var number in $scope.teams) {     
      var team = $scope.teams[number]
      var match = team.matches[$scope.lastMatch];
      if(match) {
        matchData.push({'team': number, 'side': match.side || 'purple'})
      }
    }
    return matchData
  }

});

app.controller('TeamCtrl', function($scope, $location){

});

})();