describe('googleMap directive test', function () {

  var $rootScope, scope, $q, $httpBackend, $compile, $ionicLoading, MapService, ParkingSpotMarkerService, FilterService;
  var coordinates = {lat: 52.520007, lng: 13.404954};


  beforeEach(module('parkingSpot'));

  beforeEach(inject(function (_$controller_, _$compile_, _$q_, _$httpBackend_, _$ionicLoading_, _$rootScope_, _MapService_, _FilterService_, _ParkingSpotMarkerService_) {
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
    $compile = _$compile_;
    $ionicLoading = _$ionicLoading_;
    $q = _$q_;
    MapService = _MapService_;
    FilterService = _FilterService_;
    ParkingSpotMarkerService = _ParkingSpotMarkerService_;

  }));

  beforeEach(function () {
    $httpBackend.when('GET', 'templates/map.html').respond({});
    $httpBackend.when('GET', 'templates/addProperties.html').respond({});

    spyOn($ionicLoading, 'hide').and.callFake(function () {});
    spyOn($ionicLoading, 'show').and.callFake(function () {});
    spyOn(ParkingSpotMarkerService, 'showNearParkingSpots').and.returnValue($q.when());
    spyOn(FilterService, 'setLocationSearchText').and.callFake(function () {});
    spyOn(MapService, 'getCurrPosition').and.returnValue($q.when(coordinates));
    spyOn(MapService, 'setMap').and.callFake(function () {});
    spyOn(MapService, 'getMap').and.returnValue({
      addListener: function () {},
      setCenter: function () {},
      controls: [[]]
    });

    scope = $rootScope.$new();
  });


  it('should initialise the google map', function () {
    var element = angular.element('<div google-map="" id="map"></div>');
    $compile(element)(scope);

    $rootScope.$digest();

    expect(ParkingSpotMarkerService.showNearParkingSpots).toHaveBeenCalledTimes(1);
    expect(MapService.getCurrPosition).toHaveBeenCalledTimes(1);
    expect(MapService.setMap).toHaveBeenCalledTimes(1);
    expect(MapService.getMap).toHaveBeenCalledTimes(1);
    expect($ionicLoading.show).toHaveBeenCalledWith({template: 'Loading parking spots...'});
    expect($ionicLoading.hide).toHaveBeenCalledTimes(1);
  })
});
