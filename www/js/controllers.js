angular.module('parkingSpot.controllers', [])

  .controller('AppCtrl', function ($scope) {})


  .controller('MapCtrl', function ($scope, MapService, DatabaseService, ParkingSpotMarkerService, FilterService, $ionicModal) {
    $scope.filter = FilterService.filter;

    $scope.setCurrentLocationText = function () {
      FilterService.setCurrentLocationSearchText();
    };

    $scope.onLocationChanged = function () {
      $scope.filter.locationSearchText.changed = true;
    };

    $scope.onPerimeterChanged = function () {
      $scope.filter.perimeter.value = parseInt($scope.filter.perimeter.value);
      $scope.filter.perimeter.changed = true;
    };

    $scope.applyFilter= function () {
      FilterService.applyFilter();
      $scope.closeFilter();
    };

    //Inital loading of parking spot markers
    MapService.getCurrPosition().then(function (position) {
      ParkingSpotMarkerService.showNearParkingSpots(position, 900);
    });

    $ionicModal.fromTemplateUrl('templates/filterModal.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function (modal) {
      $scope.modal = modal;
    });

    $scope.openFilter = function () {
      $scope.modal.show();
    };

    $scope.closeFilter = function () {
      $scope.modal.hide();
    };

  })


  .controller('addPropertiesCtrl', function ($scope, $ionicModal, MapService, DatabaseService, PopupService, $ionicLoading, $state, $timeout, ParkingSpotMarkerService, FilterService) {
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
      costs: "",
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
          $timeout(function() {
            google.maps.event.trigger(MapService.getMap(), 'resize');
            showSavedParkingSpot();
          });
        } else {
          $ionicLoading.hide();
          PopupService.showPopup('Failed', 'Saving parking spot to database failed');
        }
      })
    };

    function showSavedParkingSpot() {
      ParkingSpotMarkerService.showNearParkingSpots(pos, FilterService.filter.perimeter);
      MapService.getMap().setCenter(pos);
      MapService.deleteCurrentMarker();
    }
  });
