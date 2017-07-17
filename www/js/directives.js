angular.module('parkingSpot.directives', [])

  .directive('googleMap', function ($timeout, $ionicLoading, MapService, FilterService, ParkingSpotMarkerService) {
    function CenterControl(controlDiv, map) {

      // Set CSS for the control border
      var controlUI = document.createElement('div');
      controlUI.style.backgroundColor = '#387ef5';
      controlUI.style.border = '3px solid #387ef5';
      controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
      controlUI.style.marginBottom = '22px';
      controlUI.style.textAlign = 'center';
      controlDiv.appendChild(controlUI);

      // Set CSS for the control interior
      var controlText = document.createElement('div');
      controlText.style.color = 'white';
      controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
      controlText.style.fontSize = '16px';
      controlText.style.lineHeight = '38px';
      controlText.style.paddingLeft = '5px';
      controlText.style.paddingRight = '5px';
      controlText.innerHTML = 'Set marker to your position';
      controlUI.appendChild(controlText);

      // Set marker to current position
      controlUI.addEventListener('click', function () {
        MapService.getCurrPosition().then(function (position) {
          map.setCenter(position);
          MapService.setMarker(position);
        });
      });
    }

    return {
      restrict: 'A',
      link: function (scope, element, attrs) {

        MapService.setMap(new google.maps.Map(element[0], {
          center: {lat: 51.22293200000001, lng: 6.778800000000047},
          zoom: 16,
          zoomControl: false,
          streetViewControl: false,
          fullscreenControl: false
        }));

        var map = MapService.getMap();

        map.addListener('click', function (event) {
          MapService.setMarker({lat: event.latLng.lat(), lng: event.latLng.lng()});
        });

        var centerControlDiv = document.createElement('div');
        var centerControl = new CenterControl(centerControlDiv, map);

        centerControlDiv.index = 1;
        map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(centerControlDiv);

        //Inital loading of parking spot markers
        MapService.getCurrPosition().then(function (pos) {
          map.setCenter(pos);
          $ionicLoading.show({template: 'Loading parking spots...'});

          FilterService.setLocationSearchText(pos);
          ParkingSpotMarkerService.showNearParkingSpots({coordinates: pos, distance: 900.0}).then(function () {
            $ionicLoading.hide();
          });
        });
      }
    }
  });
