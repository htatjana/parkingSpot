angular.module('parkingSpot.factories', [])

  .factory('MapInitialisationService', function (MapService, ParkingSpotMarkerService) {
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
          var pos = {lat: position.latitude, lng: position.longitude};
          map.setCenter(pos);
          MapService.setMarker(pos);
        });
      });
    }

    return {
      initMap: function (element) {
        MapService.getCurrPosition().then(function (position) {
          MapService.setMap(new google.maps.Map(element, {
            center: {lat: position.latitude, lng: position.longitude},
            zoom: 16,
            zoomControl: false,
            streetViewControl: false,
            fullscreenControl: false
          }));

          var map = MapService.getMap();
          map.addListener('click', function (event) {
            var pos = {lat: event.latLng.lat(), lng: event.latLng.lng()};
            MapService.setMarker(pos);
          });

          var centerControlDiv = document.createElement('div');
          var centerControl = new CenterControl(centerControlDiv, map);

          centerControlDiv.index = 1;
          map.controls[google.maps.ControlPosition.BOTTOM_CENTER].push(centerControlDiv);
        })
      }
    }
  })


  .factory('MapService', function ($q, PopupService) {
    var currentPosition = {};
    var map;
    var marker;
    var infowindow;

    function handleError(error) {
      if (error.code === 1) {
        PopupService.showPopup('Please turn on your GPS', 'Unable to retrieve your position');
      } else if (error.code === 2) {
        PopupService.showPopup('Unable to retrieve your position', "Maybe your device is not connected to a network or can't get a satellite fix.");
      } else if (error.code === 3) {
        PopupService.showPopup("Timeout expired");
      }
    }

    var methods = {
      currentPosition: currentPosition,

      getMap: function () {
        return map;
      },

      setMap: function (_map) {
        map = _map;
      },

      setMarker: function (pos) {
        if (marker) {
          methods.deleteCurrentMarker();
        }

        marker = new google.maps.Marker({
          position: pos,
          map: map
        });

        marker.addListener('click', function () {
          infowindow = new google.maps.InfoWindow({
            content: '<a class="button button-small button-assertive" href="#/app/addProperties">Report Parking Spot</a>'
          });
          infowindow.open(map, marker);
        })
      },

      deleteCurrentMarker: function () {
        marker.setMap(null);
      },


      getMarkerPosition: function () {
        return {lat: marker.getPosition().lat(), lng: marker.getPosition().lng()};
      },

      getCurrPosition: function () {
        var q = $q.defer();
        if (navigator.geolocation) {
          var watchID = navigator.geolocation.watchPosition(function (position) {
            //coordinates can be accessed via position.ccords.latitude and position.coords.longitude
            navigator.geolocation.clearWatch(watchID);
            q.resolve(position.coords);
          }, function (error) {
            navigator.geolocation.clearWatch(watchID);
            handleError(error);
            q.reject(error);
          }, {timeout: 8000});
          return q.promise;
        }
      }
    };

    return methods;
  })


  .factory('DatabaseService', function ($http) {
    return {
      saveParkingSpotToDB: function (geoJson) {
        return $http.post("https://mc-mapapp.herokuapp.com/parkingSpot", geoJson).then(function (response) {
          return response;
        })
      },

      findNearParkingSpots: function (coordinates, distance) {
        var data = {coordinates: coordinates, distance: distance};
        return $http.post("https://mc-mapapp.herokuapp.com/nearbyParkingSpots", data).then(function (response) {
          return response.data;
        });
      }
    }
  })

  .factory('ParkingSpotMarkerService', function (MapService, DatabaseService) {
    var parkingSpots = [];
    var markers = [];


    function deleteParkingspotMarkers() {
      parkingSpots = [];
      markers.forEach(function (marker) {
        marker.setMap(null);
      });
    }

    function setParkingspotMarkers(parkingspots) {
      if(markers.length > 0) {
        deleteParkingspotMarkers();
      }

      parkingspots.forEach(function (parkingspot) {
        var marker = new google.maps.Marker({
          position: {lat: parkingspot.location.coordinates[0], lng: parkingspot.location.coordinates[1]},
          map: MapService.getMap(),
          icon: '../www/img/parking.png'
        });

        var infowindow = new google.maps.InfoWindow({
          content: parkingspot.free ? "<p>free parking</p>" : "costs: " + parkingspot.costs
        });

        marker.addListener('click', function () {
          infowindow.open(MapService.getMap(), marker);
        });

        markers.push(marker);
        parkingSpots.push(parkingspot);
      });
    }

    var methods = {
      actualizeParkingSpotMarkers: function (position) {
        parkingSpots = [];
        methods.showNearParkingSpots(position, 900);
      },

      showNearParkingSpots: function (coordinates, distance) {
        return DatabaseService.findNearParkingSpots(coordinates, distance).then(function (parkingspots) {
          setParkingspotMarkers(parkingspots);
        });
      },

      filterByPrice: function (costs) {
        var filteredParkingSpots = [];
        if (costs === 0) {
          filteredParkingSpots = parkingSpots.filter(function (parkingspot) {
            return parkingspot.free;
          });
        } else {
          filteredParkingSpots = parkingSpots.filter(function (parkingspot) {
            return parkingspot.costs <= costs;
          });
        }
        setParkingspotMarkers(filteredParkingSpots);
      }
    };
    return methods;
  })

  .factory('FilterService', function (MapService, ParkingSpotMarkerService, $q) {
    function finishFiltering(filter, newQueryNeeded) {
      if(newQueryNeeded) {
        ParkingSpotMarkerService.showNearParkingSpots(filter.coordinates, filter.perimeter).then(function () {
          checkPrice(filter.nomatter, filter.costs);
        });
      } else {
        checkPrice(filter.nomatter, filter.costs);
      }
    }

    function checkPrice(nomatter, costs) {
      if (!nomatter) {
        ParkingSpotMarkerService.filterByPrice(costs);
      }
    }

    function transformToCoordinates(searchString) {
      var q = $q.defer();
      var geocoder = new google.maps.Geocoder();
      geocoder.geocode({'address': searchString}, function (results, status) {
        if (status === 'OK') {
          var coordinates = results[0].geometry.location;
          MapService.getMap().setCenter(coordinates);
          q.resolve({lat: coordinates.lat(), lng: coordinates.lng()});
        } else {
          console.log('Geocode was not successful for the following reason: ' + status);
          q.reject();
        }
      });
      return q.promise;
    }

    return {

      applyFilter: function (filter) {
        console.log(filter);
        var newQueryNeeded = false;

        if (!(filter.perimeter === 900)) {
          filter.perimeter = parseInt(filter.perimeter);
          newQueryNeeded = true;
        }

        // Check if location has changed
        if (filter.location === 'Current Position') {
          filter.coordinates = MapService.currentPosition;
          finishFiltering(filter, newQueryNeeded);
        } else {
          // Transform search field input to coordinates
          transformToCoordinates(filter.location).then(function (coordinates) {
            filter.coordinates = coordinates;
            newQueryNeeded = true;
            finishFiltering(filter, newQueryNeeded)
          });
        }
      }
    }

  })

  .factory('PopupService', function ($ionicPopup) {
    return {
      showPopup: function(title, message) {
        $ionicPopup.show({
          title: title,
          subTitle: message,
          buttons: [
            {
              text: '<b>OK</b>',
              type: 'button-positive'
            }
          ]
        });
      }
    }
  });
