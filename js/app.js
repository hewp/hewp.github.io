$(document).ready(function(){
  var map;
  var geocoder;
  var service;
  var markers = [];

  // Initialize Google Maps map with geocoder and places service
  var initialize = function() {
    var latlng = new google.maps.LatLng(37.77493, -122.41942);

    var mapOptions = {
      center: latlng,
      scrollWheel: false,
      zoom: 12
    };
    
    geocoder = new google.maps.Geocoder();
    map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
  };

  // Pass in string with location query and returns promise with lat/long coordinates array
  var getLocationCoordinates = function(locationQuery) {
    var deferred = $.Deferred();

    var geocoderRequest = {
      address: locationQuery
    };

    geocoder.geocode(geocoderRequest, function(results, status) {
      if (status === google.maps.GeocoderStatus.OK) {
        var latLngObj = results[0].geometry.location;

        deferred.resolve(latLngObj);
      } else {
        deferred.reject("Google geocode was not successful for the following reason: " + status);
      }
    });

    return deferred.promise();
  };

  // Pass in string with place query and array of lat/long coordinates, 
  // return promise with Google Places results array
  var getPlaces = function(placeQuery, latLngObj) {
    var deferred = $.Deferred();
    var location = new google.maps.LatLng(latLngObj.lat(), latLngObj.lng());

    var request = {
      location: location,
      radius: '5000',
      query: placeQuery
    };

    service = new google.maps.places.PlacesService(map);

    service.textSearch(request, function(results, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        deferred.resolve(results);
      } else {
        deferred.reject("Google Places search was not successful for the following reason: " + status);
      }
    });

    return deferred.promise();
  };

  var addMapMarkers = function(places) {
    for (var i = 0; i < places.length; i++) {
      var place = places[i];

      var marker = new google.maps.Marker({
        position: place.geometry.location,
        url: '/'
      });

      var contentString = '<div class="info-window">' +
                            '<h6>' + place.name + '</h6>' + 
                            '<div>' + place.formatted_address + '</div>' +
                          '</div>';

      var infoWindow = new google.maps.InfoWindow({
        content: contentString
      });

      marker.setMap(map);
      marker.addListener('click', showInfoWindow.bind(null, infoWindow, marker));
      markers.push(marker);
    }
  };

  var removeMapMarkers = function() {
    for (var i = 0; i < markers.length; i++) {
      var marker = markers[i];
      markers[i].setMap(null);
    }
    markers = [];
  };

  var showInfoWindow = function(infoWindow, marker) {
    infoWindow.open(map, marker);
  };

  var createPlaceEntry = function(place) {
    var $entry = $('<li class="list-group-item menu-item"></li>');

    $entry.append('<img class="place-icon" src="' + place.icon + '">');
    $entry.append('<div class="place-text">' + 
                     '<div><strong>' + place.name + '</strong></div>' +
                     '<div>' + place.formatted_address + '</div>' +
                  '</div>');

    return $entry;
  };

  var renderPlacesList = function(places) {
    var $placesSection = $('#places-text-results');
    $placesSection.empty();

    $('#search-title').removeClass('no-search').text('Search Results');

    for (var i = 0; i < places.length; i++) {
      var place = places[i];
      var $entry = createPlaceEntry(place);
      $placesSection.append($entry);
    }
  };

  var renderSearchError = function(places) {
    var $placesSection = $('#places-text-results');
    $placesSection.empty();

    $('#search-title').addClass('no-search').text('No Places Found');
  };

  // submit listener for places search
  $('#places-form').submit(function(event) {
    event.preventDefault();

    var placeQuery = $(this).closest('form').find('input').eq(0).val();
    var locationQuery = $(this).closest('form').find('input').eq(1).val();

    getLocationCoordinates(locationQuery)
    .then(function(latLngObj) {
      // Successfully received coordinates
      map.setCenter(latLngObj);
      return getPlaces(placeQuery, latLngObj);
    }).then(function(places) {
      console.log(places);
      // Successfully received places
      removeMapMarkers();
      addMapMarkers(places);
      renderPlacesList(places);
    }).fail(function(status) {
      // Failed to receive places
      console.log(status);
      renderSearchError();
    });
  });

  google.maps.event.addDomListener(window, 'load', initialize);
});


