angular.module('parkingSpot.controllers', [])

  .controller('MapCtrl', function ($scope, $state, $ionicModal, MapService, ParkingSpotMarkerService, FilterService) {

    $scope.filter = FilterService.filter;

    $scope.$on("$ionicView.enter", function () {
      if (MapService.mapNeedsResize) {
        google.maps.event.trigger(MapService.getMap(), 'resize');
        MapService.deleteCurrentMarker();
        MapService.mapNeedsResize = false;
      }
    });

    $scope.setCurrentLocationText = function () {
      MapService.getCurrPosition().then(function (position) {
        FilterService.setLocationSearchText(position);
      });
    };

    $scope.applyFilter = function () {
      FilterService.applyFilter();
      $scope.closeFilter();
    };

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

  .controller('AddPropertiesCtrl', function ($scope, $ionicModal, $ionicLoading, $state, $timeout, $q, MapService, DatabaseService, PopupService, ParkingSpotMarkerService, FilterService) {
    var pos = MapService.getMarkerPosition();

    $scope.staticMapSrc = "https://maps.googleapis.com/maps/api/staticmap?center=&zoom=15&scale=1&size=600x300&" +
      "maptype=roadmap&format=png&visual_refresh=true&markers=icon:%7Cshadow:true%7C"
      + pos.lat + ",+" + pos.lng;

    $scope.parkingspot = {
      location: {
        type: "Point",
        coordinates: [pos.lat, pos.lng]
      },
      photo: "",
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

    $scope.takePhoto = function () {
      MapService.mapNeedsResize = true;
      navigator.camera.getPicture(function (imageData) {
        $scope.parkingspot.photo = "data:image/jpeg;base64," + imageData;
        $scope.$apply();
      }, null, {
        quality: 75,
        targetWidth: 200,
        targetHeight: 200,
        destinationType: 0
      });
    };

    $scope.submitParkingSpot = function (parkingspot) {
      if (parkingspot.free) {
        parkingspot.costs = 0;
      }

      $ionicLoading.show({
        template: 'Saving parking spot to database...'
      });

      DatabaseService.saveParkingSpotToDB(parkingspot).then(function (response) {
        if (response.status === 200) {
          $ionicLoading.hide();
          PopupService.showPopup('Done', 'Your parking spot was saved to database');
          $state.go("map");
          showSavedParkingSpot();
        } else {
          $ionicLoading.hide();
          PopupService.showPopup('Failed', 'Saving parking spot to database failed');
        }
      });
    };

    function showSavedParkingSpot() {
      $ionicLoading.show({
        template: 'Loading parkingSpots...'
      });
      ParkingSpotMarkerService.showNearParkingSpots({
        coordinates: pos,
        distance: parseFloat(FilterService.filter.perimeter)
      }).then(function (markers) {
        $ionicLoading.hide();

        markers.forEach(function (marker) {
          var markerpos = {lat: marker.getPosition().lat(), lng: marker.getPosition().lng()};

          if (markerpos.lat === pos.lat && markerpos.lng === pos.lng) {
            google.maps.event.trigger(marker, 'click');
          }

          MapService.deleteCurrentMarker();
          MapService.getMap().setCenter(pos);
          MapService.getMap().setZoom(18);
        });
      });
    }
  });
