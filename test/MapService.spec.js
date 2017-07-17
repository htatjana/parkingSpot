describe('MapService test', function () {

  var $rootScope, $q, $httpBackend, $ionicLoading, InfowindowService, MapService;
  var coordinates = {lat: 52.520007, lng: 13.404954};

  beforeEach(module('parkingSpot'));

  beforeEach(inject(function (_$rootScope_, _$httpBackend_, _MapService_, _$q_, _InfowindowService_, _$ionicLoading_) {
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
    $ionicLoading = _$ionicLoading_;
    $q = _$q_;
    MapService = _MapService_;
    InfowindowService = _InfowindowService_;

  }));

  beforeEach(function () {
    $httpBackend.when('GET', 'templates/map.html').respond({});
    $httpBackend.when('GET', 'templates/addProperties.html').respond({});
  });


  it('should set a marker on map and add an infoWindow for it', function () {
    var markerSpy = spyOn(google.maps, 'Marker').and.callFake(function () {
      return {position: {lat: 51.520007, lng: 12.404954}};
    });

    spyOn(InfowindowService, 'addInfowindow').and.callFake(function () {});

    MapService.setMarker(coordinates);

    expect(markerSpy).toHaveBeenCalledTimes(1);
    expect(InfowindowService.addInfowindow).toHaveBeenCalledTimes(1);
  });


  it('should return the current position of the device', function () {

    var returnedPosition = {};

    var position = {
      coords: {
        latitude: coordinates.lat,
        longitude: coordinates.lng
      }
    };

    spyOn(navigator.geolocation, 'watchPosition').and.callFake(function (callback) {
      callback(position);
    });
    spyOn($ionicLoading, 'show').and.callFake(function () {});
    spyOn($ionicLoading, 'hide').and.callFake(function () {});
    spyOn(navigator.geolocation, 'clearWatch').and.callFake(function () {});

    MapService.getCurrPosition().then(function (pos) {
      returnedPosition = pos;
    });

    $rootScope.$digest();

    expect(returnedPosition).toEqual(coordinates);
    expect($ionicLoading.show).toHaveBeenCalledWith({ template: 'Locating you...' });
    expect($ionicLoading.hide).toHaveBeenCalledTimes(1);

  });
});
