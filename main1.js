document.addEventListener('DOMContentLoaded', function () {
	
	var map;
	var autocomplete;
	var infowindow;
	var MARKER_PATH = 'https://maps.gstatic.com/intl/en_us/mapfiles/marker_green';
	var markers = [];
	var resultsArray = [];

	//Initialize Google Map centered on GooglePlex, autocomplete and infoWindow feature
    function initMap() {
		
		var myLatlng = {lat: 37.7836887, lng: -122.4112196};

        map = new google.maps.Map(document.getElementById('map'), {
			center: myLatlng,
			zoom: 12
        });
		
		var centerMarker = new google.maps.Marker({
			map: map
		});
		centerMarker.setPosition(myLatlng);
		google.maps.event.addListener(centerMarker, 'click', function(){
			var marker = this;
        		infoWindow.setContent('Hack Reactor');
				infoWindow.open(map, marker);
		});

		autocomplete = new google.maps.places.Autocomplete(document.getElementById('autocomplete'));
		infoWindow = new google.maps.InfoWindow();
		//autocomplete.addListener('place_changed', onPlaceChanged);
		autocomplete.addListener('place_changed', function() {
		    infoWindow.close();
		    centerMarker.setVisible(false);
		    var place = autocomplete.getPlace();
		    if (!place.geometry) {
		      window.alert("Autocomplete's returned place contains no geometry");
		      return;
		    }

		    map.setCenter(place.geometry.location);
		    map.setZoom(12);  

		    centerMarker.setPosition(place.geometry.location);
		    centerMarker.setVisible(true);
		    google.maps.event.addListener(centerMarker, 'click', function(){
			var marker = this;
        		infoWindow.setContent(place.name);
				infoWindow.open(map, marker);
			});

		});

	}

	//map will center to new location when user selects location from autocomplete field
	/*function onPlaceChanged() {

		var place = autocomplete.getPlace();
		centerMarker.setVisible(false);
		console.log(centerMarker);
		if (place.geometry) {
			console.log(marker);

			map.panTo(place.geometry.location);
			map.setZoom(12);
			var marker = new google.maps.Marker({
				position: place.geometry.location,
				map: map,
			});
			marker.setPosition(place.geometry.location);
			google.maps.event.addListener(marker, 'click', 	function showCenterWindow() {
        		var marker = this;
        		infoWindow.setContent(place.name);
				infoWindow.open(map, marker);  
  			 });
			marker.setVisible(true);

		} else{
			document.getElementById('autocomplete').placeholder = 'Enter a location';
		}
			
		clearResults();
	}*/
	


	//Find places in vicinity of location selected by user. Uses Google Places API radarSearch and getDetails
	function getPlaces(userInput, locInput, radius, type){
		
		var location = new google.maps.LatLng(locInput.geometry.location.lat(), locInput.geometry.location.lng());
		var resultsLength;
		var resultsArray = [];
		var detailArray = [];
		var detailObject = {};
		var total = 5;
		//internal_counter keeps track of completely finished callbacks
		//search_callback has run and all detail_callbacks have run
		var internal_counter = 0;
		
		var request = {
			location: location,
			keyword: userInput,
			radius: radius
		};
		
		//add type to request if user selects a type
		if(type !== 'Any Type'){
			request.type = type;
		}
		
		//PlaceService class constructor
		service = new google.maps.places.PlacesService(map);

		//Perform radar search: response: Array<PlaceResult>, PlaceServiceStatus
		service.radarSearch(request, fn_searchCallback);
		
		//callback function on Array<PlaceResult> from radarSearch
		//getDetails is async, perform rendering after requests to Google PlacesService is complete
		//renderResults after detailArray is final
		function fn_searchCallback(results, status) {
			if (status == google.maps.places.PlacesServiceStatus.OK) {
				if(results.length < total){
					total = results.length;
				}
				
				//create local counter for callback that counts down from outstanding processes. Limiting results to 5.
				var local_counter = total;
				
				for (var i = 0; i < total; i++){
					service.getDetails(results[i], fn_detailsCallback);
				}
				//callback function on getDetails response
				function fn_detailsCallback(result, status){
					if (status == google.maps.places.PlacesServiceStatus.OK) {
						detailObject = {place_id: result.place_id, name: result.name, formatted_address: result.formatted_address, location: result.geometry.location, placeIcon: result.icon};
						detailArray.push(detailObject);
					
					//reduce # of detailsCallback
					if (--local_counter === 0){
						//increase # of callbacks ran
						if(++internal_counter === total) {
							renderResults(detailArray, getLocationPhotos);
						}
					}
					}
				internal_counter++;
				}
			}
			if (status == google.maps.places.PlacesServiceStatus.ZERO_RESULTS){
				noResults();
				return;
			}
				
		}
	}
	
	//display "No Results Text"
	function noResults(){
		var noResults = document.getElementById('noResults');
		noResults.style.display = "block";
	}
	
	//render results on map and in list
	function renderResults(array, getLocationPhotos) {
		var name;
		var address;
		var resultsArea = document.getElementById("results");
		var idTag = 0;
		var url;

		for (var i = 0; i < array.length; i++){
			//add markers to map
			var markerLetter = String.fromCharCode('A'.charCodeAt(0)+ i);
			var markerIcon = MARKER_PATH + markerLetter + '.png';
			markers[i] = new google.maps.Marker({
					position: array[i].location,
					animation: google.maps.Animation.DROP,
					icon: markerIcon,
					placeIcon: array[i].placeIcon
					});
			markers[i].name = array[i].name;
			markers[i].coords = array[i].location;
			google.maps.event.addListener(markers[i], 'click', showInfoWindow);
			setTimeout(markers[i].setMap(map), i * 500);
			
			//add marker li elements to DOM
			var markerList = document.getElementById('markerList')
			var icon = document.createElement('img');
			icon.src = markerIcon;
			icon.setAttribute('id', 'img'+markerLetter);
			icon.classList.add("place-icon");
			icon.classList.add("render-icon");
			markerList.appendChild(icon);
			
			if(markers[i]){
				iconClick(i, markerLetter);
			}
	
			//add place name and address li elements to DOM
			var li = document.createElement("li");
			li.setAttribute("id", "li" + idTag);
			li.setAttribute("class", "li_name");
			var li2 = document.createElement("li");
			li2.setAttribute("id", "li" + (idTag + 1));
			li2.setAttribute("class", "li_address");
			idTag = idTag + 2;		//account for adding two li elements per result
			
			name = document.createTextNode(array[i].name);
			address = document.createTextNode(array[i].formatted_address);
			
			//append li text elements
			li.appendChild(name);
			li2.appendChild(address);
			resultsArea.appendChild(li);
			resultsArea.appendChild(li2);			
		}

		getLocationPhotos(array);
	}

	function getLocationPhotos(locations){
    	if(locations.length) getLocation(locations, successCallback, 0);
	}

	function getLocation (locations, successCallback, index) {
        var lat = locations[index].location.lat();
        var lng = locations[index].location.lng();
        var accessToken = '249457765.1fb234f.adc28edf9d7f4ad2ad281752445eac86';
        var url = 'https://api.instagram.com/v1/media/search?lat=' + lat + '&lng=' + lng + '&distance=20' + '&access_token=' + accessToken + '&callback=?';
        getJSONP(url, function (response, index) {
            successCallback(response, index);
            if (locations.length - 1 > index) getLocation(locations, successCallback, index + 1);
        }, index);
	}

	function getJSONP(url, successCallback, index) {

        var ud = '_' + +new Date(),
        script = document.createElement('script'),
        body = document.getElementsByTagName('body')[0]; 

        //callback for JSON-P response
        window[ud] = function(data) {

            script.parentNode.removeChild(script);
            if(!data) return errorCallback(index, successCallback);
            if(successCallback) successCallback(data, index);
        };
        console.log(url);
        body.appendChild(script);
        script.src = url.replace('callback=?', 'callback=' + ud);
	}

	function errorCallback(index, afterEndsCallback) {
		console.log('Your index' + index + 'had a problem retrieving the data');
  		afterEndsCallback([], index);
	}

	function successCallback(response, i){
        var results = document.getElementById("results");
        var responseLength = response.data.length;
        var totalResults = 5;
		
		//cap photos to 5 or less
		if(response.data.length < totalResults){
			responseLength = response.data.length;
		}
		else{
			responseLength = totalResults;
		}

		if(i < 5){		//i = results from search. capped at 5
		
			if(responseLength == 0){						//if there are 0 images returned, use image placeholder
				var img = document.createElement("IMG");
				img.src = 'http://www.aviatorcameragear.com/wp-content/uploads/2012/07/placeholder-150x150.jpg';
				var indexNode = (i * 2) + 2;
				var referenceNode = document.getElementById("li" + indexNode);
				results.insertBefore(img, referenceNode);
				img.setAttribute("class", "img");
				return;				
			}
			for(var j = 0; j < responseLength; j++){
				
				//create and add image element
				//indexNode used to insertBefore correct node based on li.id
				var img = document.createElement("IMG");
				img.src = response.data[j].images.thumbnail.url;
				var indexNode = (i * 2) + 2;
				var referenceNode = document.getElementById("li" + indexNode);
				results.insertBefore(img, referenceNode);
				img.setAttribute("class", "img");
			}
		}
		else { //last node, use appendChild
			var img = document.createElement("IMG");
			img.src = response.data[j].images.thumbnail.url;
			results.appendChild(img);
			img.setAttribute("class", "img");
		}
	}

	
	//function when user clicks icon
	function iconClick(i, markerLetter){
		var icon = document.getElementById("img" + markerLetter);
		icon.onclick = function(){	
			google.maps.event.trigger(markers[i], 'click');
		};
	}

	
	//clear results area and li elements in DOM
	function clearResults() {
        var results = document.getElementById('results');
		var markersResults = document.getElementById('markerList');
        while (results.childNodes[0]) {
          results.removeChild(results.childNodes[0]);
        }
		while (markersResults.childNodes[0]) {
			markersResults.removeChild(markersResults.childNodes[0]);
		}
		var noResults = document.getElementById('noResults');
		noResults.style.display = "none";
    }
	
	//set infoWindow content and open when clicked
	function showInfoWindow() {
        var marker = this;
        infoWindow.setContent('<img src="' + marker.placeIcon + '" height="15" width="15">' + "  " + marker.name);
		infoWindow.open(map, marker);  
    }
	
	//clear markers on map
	function clearMarkers() {
        for (var i = 0; i < markers.length; i++) {
          if (markers[i]) {
            markers[i].setMap(null);
          }
        }
        markers = [];
      }
	
	//event listener when user clicks submit
	document.getElementById("button1").addEventListener('click', function(){
		//make sure error results are not displayed
		var locationMiss = document.getElementById('locationMiss');
		var keywordMiss = document.getElementById('keywordMiss');
		var radiusMiss = document.getElementById('radiusMiss');
		keywordMiss.style.display = 'none';
		radiusMiss.style.display = 'none';
		
		clearMarkers();
		clearResults();
		
		var userInput = document.getElementById('placeSearch').value;
		var locationInput = autocomplete.getPlace();
		var locationCheck = document.getElementById('autocomplete').value;
		var radius = document.getElementById('radius').value;
		var type = document.getElementById('type').value;
		
		//show error messages if fields left blank
		if(locationInput == ''){
			locationMiss.style.display = 'block';
			return;
		}
		if(userInput == ''){
			keywordMiss.style.display = 'block';
			return;
		}  
		if(radius == ''){
			radiusMiss.style.display = 'block';
			return;
		}  
		  
		  getPlaces(userInput, locationInput, radius, type);
		  
	  });
	
	//initialize map after window Dom is loaded
	google.maps.event.addDomListener(window, 'load', initMap);  

});