describe('ParkingSpotMarkerService test', function () {

  var $rootScope, $httpBackend, MapService, InfowindowService, ParkingSpotMarkerService;
  var coordinates = {lat: 52.520007, lng: 13.404954};
  var parkingSpotsMock = [{
    free: true,
    costs: 0,
    weekdays: {
      Mon: true
    },
    location: {
      coordinates: [coordinates.lat, coordinates.lng]
    }
  }, {
    free: false,
    costs: 1.8,
    weekdays: {
      Mon: true
    },
    location: {
      coordinates: [coordinates.lat, coordinates.lng]
    }
  }];

  beforeEach(module('parkingSpot'));

  beforeEach(inject(function (_$controller_, _$rootScope_, _$httpBackend_, _ParkingSpotMarkerService_, _MapService_, _InfowindowService_) {
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
    ParkingSpotMarkerService = _ParkingSpotMarkerService_;
    MapService = _MapService_;
    InfowindowService = _InfowindowService_;
  }));

  beforeEach(function () {
    $httpBackend.when('GET', 'templates/map.html').respond({});
    $httpBackend.when('GET', 'templates/addProperties.html').respond({});

    spyOn(InfowindowService, 'addInfowindow').and.callFake(function (marker, map, parkingSpot) {});
  });

  it('should showNearParkingspots', function () {
    var mapSpy = spyOn(MapService, 'getMap').and.returnValue({});
    var markerSpy = spyOn(google.maps, 'Marker');


    $httpBackend.expectPOST('https://mc-mapapp.herokuapp.com/nearbyParkingSpots', {
      coordinates: coordinates,
      distance: 900
    }).respond(parkingSpotsMock);

    ParkingSpotMarkerService.showNearParkingSpots({
      coordinates: coordinates,
      distance: 900
    });

    $httpBackend.flush();

    expect(mapSpy).toHaveBeenCalledTimes(5);
    expect(markerSpy).toHaveBeenCalledTimes(2);
    expect(InfowindowService.addInfowindow).toHaveBeenCalledTimes(2);
  });


  it('should filter parking spots by price', function () {
    ParkingSpotMarkerService.filterByPrice(1.5, parkingSpotsMock);

    expect(InfowindowService.addInfowindow).toHaveBeenCalledWith(jasmine.any(Object), undefined, parkingSpotsMock[0]);
    expect(InfowindowService.addInfowindow).toHaveBeenCalledTimes(1);
  });

  it('should filter parking spots by price', function () {
    ParkingSpotMarkerService.filterByPrice(2.0, parkingSpotsMock);

    expect(InfowindowService.addInfowindow).toHaveBeenCalledWith(jasmine.any(Object), undefined, parkingSpotsMock[0]);
    expect(InfowindowService.addInfowindow).toHaveBeenCalledWith(jasmine.any(Object), undefined, parkingSpotsMock[1]);
    expect(InfowindowService.addInfowindow).toHaveBeenCalledTimes(2);
  })
});


