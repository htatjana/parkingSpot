describe('MapCtrl test', function () {

  var $controller, $rootScope, scope, $q, $httpBackend, $ionicLoading, $ionicModal, MapService, FilterService, ParkingSpotMarkerService;
  var coordinates = {lat: 52.520007, lng: 13.404954};

  var createCtrl = function () {
    var scope = $rootScope.$new();
    $controller('MapCtrl', {
      $scope: scope
    });
    return scope;
  };

  beforeEach(module('parkingSpot', function ($provide) {
    $provide.factory('MapService', function () {
      return {
        mapNeedsResize: true,
        getCurrPosition: function () {},
        getMap: function () {},
        deleteCurrentMarker: function () {}
      }
    })
  }));

  beforeEach(inject(function (_$controller_, _$httpBackend_, _$rootScope_, _$q_, _$ionicLoading_, _$ionicModal_, _MapService_, _FilterService_, _ParkingSpotMarkerService_) {
    $controller = _$controller_;
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
    $ionicLoading = _$ionicLoading_;
    $q = _$q_;
    $ionicModal = _$ionicModal_;
    MapService = _MapService_;
    FilterService = _FilterService_;
    ParkingSpotMarkerService = _ParkingSpotMarkerService_;
  }));

  beforeEach(function () {
    $httpBackend.when('GET', 'templates/map.html').respond({});
    $httpBackend.when('GET', 'templates/addProperties.html').respond({});

    spyOn(FilterService, 'setLocationSearchText').and.callFake(function () {});
    spyOn($ionicModal, 'fromTemplateUrl').and.returnValue($q.when());

  });

  it('should initialise the modal', function () {
    scope = createCtrl();
    $rootScope.$digest();

    expect($ionicModal.fromTemplateUrl).toHaveBeenCalledWith('templates/filterModal.html', {
      scope: scope,
      animation: 'slide-in-up'
    })
  });

  it('should set current location searchtext', function () {
    spyOn(MapService, 'getCurrPosition').and.returnValue($q.when(coordinates));

    scope = createCtrl();
    scope.setCurrentLocationText();
    $rootScope.$digest();

    expect(MapService.getCurrPosition).toHaveBeenCalledTimes(1);
    expect(FilterService.setLocationSearchText).toHaveBeenCalledWith(coordinates);
    expect(FilterService.setLocationSearchText).toHaveBeenCalledTimes(1);
  });


  it('should call applyFilter from FilterService and close the filter modal after filter was set', function () {
    scope = createCtrl();

    spyOn(FilterService, 'applyFilter').and.callFake(function () {});
    spyOn(scope, 'closeFilter').and.callFake(function () {});

    scope.applyFilter();

    expect(FilterService.applyFilter).toHaveBeenCalledTimes(1);
    expect(scope.closeFilter).toHaveBeenCalledTimes(1);
  });

  it('should resize map if needed', function () {
    spyOn(google.maps.event, 'trigger').and.callFake(function () {});
    spyOn(MapService, 'deleteCurrentMarker').and.callFake(function () {});

    scope.$broadcast('$ionicView.enter');

    expect(google.maps.event.trigger).toHaveBeenCalledWith(MapService.getMap(), 'resize');
  })

});
