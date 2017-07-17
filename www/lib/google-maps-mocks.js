google = {
  maps: {
    LatLng: function (lat, lng) {
      return {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),

        lat: function () {
          return this.latitude;
        },
        lng: function () {
          return this.longitude;
        }
      };
    },
    LatLngBounds: function (ne, sw) {
      return {
        getSouthWest: function () {
          return sw;
        },
        getNorthEast: function () {
          return ne;
        }
      };
    },
    OverlayView: function () {
      return {};
    },
    InfoWindow: function () {
      return {};
    },
    Marker: function () {
      return {};
    },
    Map: function () {
      return {};
    },
    Geocoder: function () {
      return {
        geocode: function () {

        }
      }
    }, event: {
      trigger: function () {

      }
    }, ControlPosition: {
      BOTTOM_CENTER: 0
    }, geometry: {
      spherical: {
        computeDistanceBetween: function (p1, p2) {
          return 0;
        }
      }
    }
  }
};


function MarkerClusterer(map, opt_markers, opt_options) {
}

