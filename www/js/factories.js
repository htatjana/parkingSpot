angular.module('parkingSpot.factories', [])

  .factory('MapService', function ($q, $ionicLoading, $timeout, InfowindowService, PopupService) {
    var map;
    var marker;
    var mapNeedsRisze = false;

    var methods = {
      mapNeedsResize: mapNeedsRisze,

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

        InfowindowService.addInfowindow(marker, map);
      },

      deleteCurrentMarker: function () {
        marker.setMap(null);
      },

      getMarkerPosition: function () {
        return {lat: marker.getPosition().lat(), lng: marker.getPosition().lng()};
      },

      // Get current position of client with watchPosition and then clear watch to stop watching the position
      // (there occurred problems with navigator.geolocation.getCurrentPosition)
      getCurrPosition: function () {
        $ionicLoading.show({template: 'Locating you...'});
        var deferrer = $q.defer();
        if (navigator.geolocation) {
          var watchID = navigator.geolocation.watchPosition(function (position) {
            $ionicLoading.hide();
            navigator.geolocation.clearWatch(watchID);
            deferrer.resolve({lat: position.coords.latitude, lng: position.coords.longitude});
          }, function (error) {
            $ionicLoading.hide();
            navigator.geolocation.clearWatch(watchID);
            PopupService.showRequireConfirm();
            deferrer.reject(error);
          }, {timeout: 8000});

          return deferrer.promise;
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

      findNearParkingSpots: function (data) {
        return $http.post("https://mc-mapapp.herokuapp.com/nearbyParkingSpots", data).then(function (response) {
          return response.data;
        });
      }
    }
  })

  .factory('ParkingSpotMarkerService', function (MapService, DatabaseService, InfowindowService) {
    var parkingSpots = [];
    var markers = [];
    var clusterer = null;

    function setMarkerInCluster(map, markers) {
      clusterer = new MarkerClusterer(map, markers, {
        maxZoom: 18,
        minimumClusterSize: 3,
        zoomOnClick: true,
        imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
      });
    }

    function deleteParkingspotMarkers() {
      parkingSpots = [];
      markers.forEach(function (marker) {
        marker.setMap(null);
      });

      markers = [];
      clusterer.clearMarkers();
    }

    function setParkingspotMarkers(parkingspots) {
      if (markers.length > 0) {
        deleteParkingspotMarkers();
      }

      parkingspots.forEach(function (parkingspot) {
        var marker = new google.maps.Marker({
          position: {lat: parkingspot.location.coordinates[0], lng: parkingspot.location.coordinates[1]},
          map: MapService.getMap(),
          icon: '../www/img/parking.png'
        });

        InfowindowService.addInfowindow(marker, MapService.getMap(), parkingspot);

        markers.push(marker);
        parkingSpots.push(parkingspot);
      });
      setMarkerInCluster(MapService.getMap(), markers);
    }

    return {
      parkingSpots: parkingSpots,

      showNearParkingSpots: function (data) {
        return DatabaseService.findNearParkingSpots(data).then(function (parkingspots) {
          setParkingspotMarkers(parkingspots);
          return markers;
        });
      },

      filterByPrice: function (costs, parkingSpots) {
        var filteredParkingSpots = parkingSpots.filter(function (parkingspot) {
          return parkingspot.costs <= costs;
        });
        setParkingspotMarkers(filteredParkingSpots);
      }
    };
  })

  .factory('FilterService', function (MapService, ParkingSpotMarkerService, DatabaseService, $q, $ionicLoading) {

    var filter = {
      costs: 5.00,
      perimeter: 900,
      locationSearchText: "",
      coordinates: {}
    };

    var methods = {
      filter: filter,

      applyFilter: function () {
        $ionicLoading.show({template: 'Loading parking spots...'});
        return methods.transformTextToCoordinates(filter.locationSearchText).then(function (coordinates) {
          filter.coordinates = coordinates;
          return DatabaseService.findNearParkingSpots({
            coordinates: coordinates,
            distance: parseFloat(filter.perimeter)
          }).then(function (parkingSpots) {
            ParkingSpotMarkerService.filterByPrice(filter.costs, parkingSpots);
            $ionicLoading.hide();
          });
        });
      },

      setLocationSearchText: function (position) {
        filter.coordinates = position;
        methods.transformCoordinatesToText(position).then(function (searchText) {
          filter.locationSearchText = searchText;
        })
      },

      transformTextToCoordinates: function (searchString) {
        var deferrer = $q.defer();
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({'address': searchString}, function (results, status) {
          if (status === 'OK') {
            var coordinates = results[0].geometry.location;
            MapService.getMap().setCenter(coordinates);
            deferrer.resolve({lat: coordinates.lat(), lng: coordinates.lng()});
          } else {
            deferrer.reject('Geocode was not successful for the following reason: ' + status);
          }
        });
        return deferrer.promise;
      },

      transformCoordinatesToText: function (position) {
        var deferrer = $q.defer();
        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({'location': position}, function (results, status) {
          if (status === 'OK') {
            if (results[1]) {
              for (var i = 0; i < results[0].address_components.length; i++) {
                for (var k = 0; k < results[0].address_components[i].types.length; k++) {
                  if (results[0].address_components[i].types[k] === "street_number")
                    streetNumber = results[0].address_components[i].long_name;
                  else if (results[0].address_components[i].types[k] === "route")
                    streetName = results[0].address_components[i].short_name;
                  else if (results[0].address_components[i].types[k] === "locality")
                    city = results[0].address_components[i].long_name;
                }
              }
              deferrer.resolve(streetName + ' ' + streetNumber + ', ' + city);
            } else {
              deferrer.reject('No results found');
            }
          } else {
            deferrer.reject('Geocoder failed due to: ' + status);
          }
        });
        return deferrer.promise;
      }
    };

    return methods;
  })

  .factory('PopupService', function ($ionicPopup, $window) {

    function checkLocationState() {
      cordova.plugins.diagnostic.isLocationEnabled(function (enabled) {
        if (enabled) {
          $window.location.reload();
        } else {
          methods.showRequireConfirm();
        }
      });
    }

    var methods = {
      showPopup: function (title, message) {
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
      },

      showRequireConfirm: function () {
        var popup = $ionicPopup.show({
          title: "The app needs GPS and internet connection",
          subTitle: "Would you like to switch to the Location Settings page and do this manually?",
          buttons: [
            {
              text: '<b>Cancel</b>',
              type: 'button-positive outline'
            },
            {
              text: '<b>OK</b>',
              type: 'button-positive',
              onTap: function () {
                popup.close();
                cordova.plugins.diagnostic.switchToWifiSettings();
                cordova.plugins.diagnostic.switchToLocationSettings();
                document.addEventListener('resume', checkLocationState, false);
              }
            }
          ]
        });
      }
    };

    return methods;
  })

  .factory('InfowindowService', function () {
    var position;

    var watchID = navigator.geolocation.watchPosition(function (pos) {
      navigator.geolocation.clearWatch(watchID);
      position = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
    }, null, {timeout: 8000});

    var infowindow = new google.maps.InfoWindow({content: ''});

    function calculateDistance(point1, point2) {
      return google.maps.geometry.spherical.computeDistanceBetween(point1, point2).toFixed(0);
    }

    function checkDate(parkingspot) {
      var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      var day = new Date().getDay();

      // If chargeable property is false for the current weekday, set the parkingspot free property to true
      if (!parkingspot.free && !parkingspot.weekdays[days[day]]) {
        parkingspot.free = true;
      }
    }

    var methods = {
      addInfowindow: function (marker, map, parkingspot) {
        var content = methods.buildTemplate(parkingspot);

        marker.addListener('click', function () {
          infowindow.setContent(content);
          infowindow.open(map, marker);
        })
      },

      buildTemplate: function (parkingspot) {
        var distance = 0;
        var content = '<a class="button button-small button-assertive" href="#/addProperties">Report parking spot</a>';

        if (parkingspot) {
          distance = calculateDistance(position, new google.maps.LatLng(parkingspot.location.coordinates[0], parkingspot.location.coordinates[1]));
          checkDate(parkingspot);

          var photo = "";
          if (parkingspot.photo) {
            photo = "<div class='center'><img class='parkingSpotImg' src='" + parkingspot.photo + "'></div>";
          }

          if (parkingspot.free) {
            content =
              "<div class='infowindow'>" +
              "<img src='img/free-sticker.png' class='infowindowIcon'>" +
              "<span class='infowindowText'><b>Free parking</b>" +
              "<br>" + distance + " m away from you</span><br>" +
              photo +
              "</div>";
          } else {
            content =
              "<div class='infowindow'>" +
              "<img src='img/coins.png' class='infowindowIcon'>" +
              "<span class='infowindowText'>" + "<b>" + parkingspot.costs + " € per hour </b>" +
              "<br>" + distance + " m away from you</span>" +
              photo +
              "</div>";
          }
        }
        return content;
      }
    };

    return methods;
  })
;
