describe('FilterService test', function () {

  var $rootScope, $q, $ionicLoading, $httpBackend, FilterService, MapService, ParkingSpotMarkerService, DatabaseService;
  var coordinates = {lat: 52.520007, lng: 13.404954};

  beforeEach(module('parkingSpot'));


  beforeEach(inject(function (_$controller_, _$rootScope_, _$httpBackend_, _$q_, _$ionicLoading_, _FilterService_, _MapService_, _DatabaseService_, _ParkingSpotMarkerService_) {
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
    $ionicLoading = _$ionicLoading_;
    $q = _$q_;
    FilterService = _FilterService_;
    MapService = _MapService_;
    DatabaseService = _DatabaseService_;
    ParkingSpotMarkerService = _ParkingSpotMarkerService_;
  }));

  beforeEach(function () {
    $httpBackend.when('GET', 'templates/map.html').respond({});
    $httpBackend.when('GET', 'templates/addProperties.html').respond({});
  });


  it('should call transformTextToCoordinates, showNearParkingSpots, filterByPrice and should show $ionicLoading while loading', function () {
    FilterService.filter.locationSearchText = "Berlin";
    FilterService.filter.costs = 1.00;
    FilterService.filter.perimeter = 500;

    var parkingspotMock = {
      free: true,
      costs: 0,
      weekdays: {
        Mon: true
      },
      location: {
        coordinates: [coordinates.lat, coordinates.lng]
      }
    };

    $httpBackend.expectPOST('https://mc-mapapp.herokuapp.com/nearbyParkingSpots', {
      coordinates: coordinates,
      distance: 500
    }).respond([parkingspotMock]);

    spyOn(FilterService, 'transformTextToCoordinates').and.returnValue($q.when(coordinates));
    spyOn(DatabaseService, 'findNearParkingSpots').and.returnValue($q.when(["parkingspots"]));
    spyOn(ParkingSpotMarkerService, 'filterByPrice').and.callFake(function (costs) {});
    spyOn($ionicLoading, 'show').and.callFake(function () {});
    spyOn($ionicLoading, 'hide').and.callFake(function () {});

    FilterService.applyFilter();

    $rootScope.$digest();

    expect(FilterService.filter.coordinates).toBe(coordinates);
    expect(DatabaseService.findNearParkingSpots).toHaveBeenCalledWith({coordinates: coordinates, distance: 500});
    expect($ionicLoading.hide).toHaveBeenCalledTimes(1);
    expect($ionicLoading.show).toHaveBeenCalledTimes(1);
    expect(ParkingSpotMarkerService.filterByPrice).toHaveBeenCalledWith(1.00, ["parkingspots"]);
  });


  it('should set the locationSearchText variable to the delivered coordinates', function () {
    var locationSearchTextMock = "Berlin";
    spyOn(FilterService, 'transformCoordinatesToText').and.returnValue($q.when(locationSearchTextMock));

    FilterService.setLocationSearchText(coordinates);
    $rootScope.$digest();

    expect(FilterService.filter.locationSearchText).toBe(locationSearchTextMock);
  });


  it('should transform the delivered text to coordinates', function () {

    var getMapSpy = spyOn(MapService, 'getMap').and.returnValue({
      setCenter: function () {
      }
    });

    var geocoderSpy = spyOn(google.maps, 'Geocoder').and.callFake(function () {
      return {
        geocode: function (address, callback) {
          callback([{
            geometry: {
              location: {
                lat: function () {
                  return coordinates.lat
                }, lng: function () {
                  return coordinates.lng;
                }
              }
            }
          }], 'OK')
        }
      }
    });

    FilterService.transformTextToCoordinates("Berlin").then(function (coord) {
      expect(coord).toEqual(coordinates);
    });
    $rootScope.$digest();

    expect(getMapSpy).toHaveBeenCalledTimes(1);
    expect(geocoderSpy).toHaveBeenCalledTimes(1);
  });


  it('should transform coordinates to an address', function () {

    var geocoderSpy = spyOn(google.maps, 'Geocoder').and.callFake(function () {
      return {
        geocode: function (address, callback) {
          callback(
            [{
              address_components: [{
                long_name: 18,
                types: ["street_number"]
              }, {
                short_name: "Bachstr.",
                types: ["route"]
              }, {
                long_name: "Berlin",
                types: ["locality", "political"]
              }]
            }, "result"], 'OK');
        }
      }
    });

    FilterService.transformCoordinatesToText().then(function (locationString) {
      expect(locationString).toBe("Bachstr. " + 18 + ", Berlin");
    });

    $rootScope.$digest();
    expect(geocoderSpy).toHaveBeenCalledTimes(1);
  })

});
