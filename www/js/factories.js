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
          map.setCenter(position);
          MapService.setMarker(position);
        });
      });
    }

    return {
      initMap: function (element) {
        MapService.getCurrPosition().then(function (position) {
          MapService.setMap(new google.maps.Map(element, {
            center: position,
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
        })
      }
    }
  })


  .factory('MapService', function ($q, PopupService, InfowindowService) {
    var map;
    var marker;

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

      getCurrPosition: function () {
        var q = $q.defer();
        if (navigator.geolocation) {
          var watchID = navigator.geolocation.watchPosition(function (position) {
            navigator.geolocation.clearWatch(watchID);
            q.resolve({lat: position.coords.latitude, lng: position.coords.longitude});
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

  .factory('ParkingSpotMarkerService', function (MapService, DatabaseService, InfowindowService) {
    var parkingSpots = [];
    var markers = [];
    var clusterer = null;

    function setMarkerInCluster(map, markers) {
      clusterer = new MarkerClusterer(map, markers, {
        maxZoom: 17,
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
      showNearParkingSpots: function (coordinates, distance) {
        parkingSpots = [];
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
  })

  .factory('FilterService', function (MapService, ParkingSpotMarkerService, $q) {
    var filter = {
      costs: 5.00,
      perimeter: {
        value: 900,
        changed: false
      },
      locationSearchText: {
        value: "",
        changed: false
      },
      coordinates: {}
    };

    function transformCoordinatesToText(position) {
      var q = $q.defer();
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
            q.resolve(streetName + ' ' + streetNumber + ' ' + city);
          } else {
            q.reject('No results found');
          }
        } else {
          q.reject('Geocoder failed due to: ' + status);
        }
      });
      return q.promise;
    }

    function transformTextToCoordinates(searchString) {
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

    var methods = {
      filter: filter,

      applyFilter: function () {
        if(filter.locationSearchText.changed) {
          transformTextToCoordinates(filter.locationSearchText.value).then(function (coordinates) {
            filter.coordinates = coordinates;
            methods.applyPerimeterAndPrice(coordinates);
          });
        } else {
          methods.applyPerimeterAndPrice(filter.coordinates);
        }
      },

      applyPerimeterAndPrice: function (coordinates) {
        if (filter.perimeter.changed) {
          ParkingSpotMarkerService.showNearParkingSpots(filter.coordinates, filter.perimeter.value).then(function () {
            ParkingSpotMarkerService.filterByPrice(filter.costs);
          });
        } else {
          ParkingSpotMarkerService.filterByPrice(filter.costs);
        }
      },

      setCurrentLocationSearchText: function () {
        MapService.getCurrPosition().then(function (position) {
          filter.coordinates = position;
          transformCoordinatesToText(position).then(function (searchText) {
            filter.locationSearchText.value = searchText;
          })
        })
      }
    };
    methods.setCurrentLocationSearchText();

    return methods;
  })

  .factory('PopupService', function ($ionicPopup) {
    return {
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
      }
    }
  })

  .factory('InfowindowService', function () {
    var infowindow = new google.maps.InfoWindow({content: ''});
    var reportButton = '<a class="button button-small button-assertive" href="#/app/addProperties">Report Parking Spot</a>';

    function checkDate(parkingspot) {
      var days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      var day = new Date().getDay();

      // If chargeable property is false for the current weekday, set the parkingspot free property to true
      if (!parkingspot.free && !parkingspot.weekdays[days[day]]) {
        parkingspot.free = true;
      }
    }

    return {
      addInfowindow: function (marker, map, parkingspot) {
        marker.addListener('click', function () {
          if (parkingspot) {
            checkDate(parkingspot);

            var freeParking_InfoTemp =
              "<div class='infowindow'>" +
              "<div class='infoIcon'><img src='img/free-sticker.png' class='infowindowIcon'></div>" +
              "<p>Free parking</p>" +
              "</div>";
            var parkingWithCosts_InfoTemp =
              "<div class='infowindow'>" +
              "<div class='infoIcon'><img src='img/coins.png' class='infowindowIcon'></div>" +
              "<p>" + parkingspot.costs + " € per hour </p>" +
              "</div>";

            infowindow.setContent(parkingspot.free ? freeParking_InfoTemp : parkingWithCosts_InfoTemp);
          } else {
            infowindow.setContent(reportButton);
          }
          infowindow.open(map, marker);
        })
      }
    }
  });
