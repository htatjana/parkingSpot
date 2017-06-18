angular.module('parkingSpot.directives', [])

  .directive('googleMap', function (MapInitialisationService) {
    return {
        restrict: 'A',
        link: function (scope, element, attrs) {
          MapInitialisationService.initMap(element[0]);
        }
      }
    }
  );
