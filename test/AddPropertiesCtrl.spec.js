describe('AddPropertiesCtrl test', function () {

  var $controller, $rootScope, scope, $q, $httpBackend, $ionicLoading, $state,
    DatabaseService, ParkingSpotMarkerService, MapService, PopupService;

  var parkingSpotMock = {
    free: true,
    costs: 2.1,
    weekdays: {
      Mon: true
    }
  };
  var coordinates = {lat: 52.520007, lng: 13.404954};

  var createCtrl = function () {
    var scope = $rootScope.$new();
    $controller('AddPropertiesCtrl', {
      $scope: scope
    });
    return scope;
  };

  beforeEach(module('parkingSpot'));

  beforeEach(inject(function (_$controller_, _$httpBackend_, _$rootScope_, _$state_, _$q_, _$ionicLoading_, _ParkingSpotMarkerService_, _DatabaseService_, _MapService_, _PopupService_) {
    $controller = _$controller_;
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
    $ionicLoading = _$ionicLoading_;
    $state = _$state_;
    $q = _$q_;
    DatabaseService = _DatabaseService_;
    MapService = _MapService_;
    PopupService = _PopupService_;
    ParkingSpotMarkerService = _ParkingSpotMarkerService_;

  }));

  beforeEach(function () {
    $httpBackend.when('GET', 'templates/map.html').respond({});
    $httpBackend.when('GET', 'templates/addProperties.html').respond({});

    spyOn(MapService, 'getMarkerPosition').and.returnValue(coordinates);

    scope = createCtrl();

    spyOn($ionicLoading, 'show').and.callFake(function () {});
    spyOn($ionicLoading, 'hide').and.callFake(function () {});
    spyOn(PopupService, 'showPopup').and.callFake(function (title, message) {});
  });


  it('should submit parking spot information to DatabaseService and call showNearParkingSpots to show saved parking spot', function () {
    scope.parkingSpot = {};

    var response = {status: 200};
    var mapSpy = spyOn(MapService, 'getMap').and.returnValue({
      setCenter: function () {},
      setZoom: function () {}
    });

    spyOn($state, 'go').and.callFake(function () {});
    spyOn(MapService, 'deleteCurrentMarker').and.callFake(function () {});
    spyOn(ParkingSpotMarkerService, 'showNearParkingSpots').and.returnValue($q.when([{getPosition: function () {
      return {
        lat: function () {},
        lng: function () {}
      }
    }}]));

    $httpBackend.expectPOST('https://mc-mapapp.herokuapp.com/parkingSpot', {
      free: true,
      costs: 0,
      weekdays: {
        Mon: true
      }
    }).respond(response);


    scope.submitParkingSpot(parkingSpotMock);
    $httpBackend.flush();
    $rootScope.$digest();


    expect(parkingSpotMock.costs).toBe(0);
    expect($ionicLoading.show).toHaveBeenCalledWith({template: 'Saving parking spot to database...'});
    expect($ionicLoading.show).toHaveBeenCalledWith({template: 'Loading parkingSpots...'});
    expect($ionicLoading.hide).toHaveBeenCalledTimes(2);
    expect(PopupService.showPopup).toHaveBeenCalledWith('Done', 'Your parking spot was saved to database');
    expect($state.go).toHaveBeenCalledWith("map");
    expect(MapService.deleteCurrentMarker).toHaveBeenCalledTimes(1);
    expect(mapSpy).toHaveBeenCalledTimes(2);
  });


it('should show error message, if uploading to server failed', function () {
  var response = {status: 500};

  spyOn(DatabaseService, 'saveParkingSpotToDB').and.returnValue($q.when(response));

  scope.submitParkingSpot(parkingSpotMock);

  // should be called before promise
  expect($ionicLoading.show).toHaveBeenCalledWith({template: 'Saving parking spot to database...'});

  $rootScope.$digest();

  // should be called after promise
  expect(PopupService.showPopup).toHaveBeenCalledWith('Failed', 'Saving parking spot to database failed');
  expect($ionicLoading.hide).toHaveBeenCalledTimes(1);
});


  afterEach(function () {
    var staticMapSrcMock = "https://maps.googleapis.com/maps/api/staticmap?center=&zoom=15&scale=1&size=600x300&" +
      "maptype=roadmap&format=png&visual_refresh=true&markers=icon:%7Cshadow:true%7C"
      + coordinates.lat + ",+" + coordinates.lng;

    expect(scope.staticMapSrc).toBe(staticMapSrcMock);
  });

});
