angular.module('parkingSpot.controllers', [])

  .controller('AppCtrl', function ($scope) {
  })


  .controller('MapCtrl', function ($scope, MapService, DatabaseService, ParkingSpotMarkerService) {
    //Inital loading of parking spot markers
    MapService.getCurrPosition().then(function (position) {
      ParkingSpotMarkerService.showNearParkingSpots({lat: position.latitude, lng: position.longitude}, 900);
      MapService.currentPosition = {lat: position.latitude, lng: position.longitude};
    });
  })


  .controller('addPropertiesCtrl', function ($scope, $ionicModal, MapService, DatabaseService, PopupService, $ionicLoading, $state, ParkingSpotMarkerService) {
    var pos = MapService.getMarkerPosition();

    $scope.staticMapSrc = "https://maps.googleapis.com/maps/api/staticmap?center=&zoom=15&scale=1&size=600x300&" +
      "maptype=roadmap&format=png&visual_refresh=true&markers=icon:%7Cshadow:true%7C"
      + pos.lat + ",+" + pos.lng;

    $scope.parkingspot = {
      location: {
        type: "Point",
        coordinates: [pos.lat, pos.lng]
      },
      free: true,
      costs: 0,
      weekdays: {
        Mon: true,
        Tue: true,
        Wed: true,
        Thu: true,
        Fri: true,
        Sat: true,
        Sun: true
      }
    };

    $scope.submitParkingSpot = function () {
      if ($scope.parkingspot.free) {
        $scope.parkingspot.costs = 0;
      }

      $ionicLoading.show({
        template: 'Saving parking spot to database...'
      });

      DatabaseService.saveParkingSpotToDB($scope.parkingspot).then(function (response) {
        if (response.status === 200) {
          $ionicLoading.hide();
          PopupService.showPopup('Done', 'Your parking spot was saved to database');
          $state.transitionTo("app.map");
          showSavedParkingSpot();
        } else {
          $ionicLoading.hide();
          PopupService.showPopup('Failed', 'Saving parking spot to database failed');
        }
      })
    };

    function showSavedParkingSpot() {
      ParkingSpotMarkerService.actualizeParkingSpotMarkers(pos);
      MapService.getMap().setCenter(pos);
      MapService.deleteCurrentMarker();
    }
  });
