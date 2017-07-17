describe('InfowindowService test', function () {

  var $rootScope, $q, $httpBackend, InfowindowService;
  var parkingSpotMock;

  beforeEach(module('parkingSpot'));

  beforeEach(inject(function (_$controller_, _$rootScope_, _$httpBackend_, _$q_, _InfowindowService_) {
    $rootScope = _$rootScope_;
    $httpBackend = _$httpBackend_;
    $q = _$q_;
    InfowindowService = _InfowindowService_;
  }));

  beforeEach(function () {
    $httpBackend.when('GET', 'templates/map.html').respond({});
    $httpBackend.when('GET', 'templates/addProperties.html').respond({});

    parkingSpotMock = {
      location: {
        coordinates: [51.427462, 45.3672877]
      },
      free: false,
      costs: 1.8,
      weekdays: {
        Mon: false,
        Sun: true,
        Tue: true,
        Wed: true,
        Thu: true,
        Fri: true,
        Sat: true
      }
    };

    spyOn(window, 'Date').and.returnValue({
      getDay: function () {
        return 1; // Monday
      }
    });
  });

  it('should add a click event listener to the marker', function () {
    var marker = {
      addListener: function () {}
    };

    var listenerSpy = spyOn(marker, 'addListener');

    InfowindowService.addInfowindow(marker, {}, parkingSpotMock);

    expect(listenerSpy).toHaveBeenCalledWith('click', jasmine.anything());
    expect(parkingSpotMock.free).toBe(true);
  });


  it('should set the infowindow content to -free parking template-, if the chargeable property is false for this weekday', function () {
    var freeParking_InfoTempMock =
      "<div class='infowindow'>" +
      "<img src='img/free-sticker.png' class='infowindowIcon'>" +
      "<span class='infowindowText'><b>Free parking</b>" +
      "<br>" + 0 + " m away from you</span><br>" +
      "</div>";

    parkingSpotMock.free = true;

    var template = InfowindowService.buildTemplate(parkingSpotMock);
    expect(template).toBe(freeParking_InfoTempMock);
  });


  it('should set the infowindow content to -report parking spot template-, if no parking spot was delivered', function () {

    var reportButtonTempMock = '<a class="button button-small button-assertive" href="#/addProperties">Report parking spot</a>';

    var template = InfowindowService.buildTemplate();
    expect(template).toBe(reportButtonTempMock);
  });


  it('should set the infowindow content to -chargeable parking spot template-, if parking spot is not free', function () {
    parkingSpotMock.weekdays.Mon = true;

    var parkingSpotTempMock =
      "<div class='infowindow'>" +
      "<img src='img/coins.png' class='infowindowIcon'>" +
      "<span class='infowindowText'>" + "<b>"+ 1.8 + " € per hour </b>" +
      "<br>" + 0 + " m away from you</span>" +
      "</div>";

    var template = InfowindowService.buildTemplate(parkingSpotMock);
    expect(template).toBe(parkingSpotTempMock);
  })

});
