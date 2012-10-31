
	/**
	 * Controller
	 */
	var Controller = function () {
		
		var cordinates = null;
		
		function init(){
			Cache.init();
			setUserAddress();
			if(isNotDemo()){
				fetchNotesInCache();
			}
			addListFilter($("#notesfilter"), $("#noteslist"));
			showLastSearch();
			showUserLocation();
			showUserSettings();
			displayBookmarks();
		}
		
		function isNotDemo(){
			var searchString = window.location.search
			
			if(searchString.toLowerCase().match('demo')){
				
				apiUrl = "api/index.php/note.json/filter/locationfilter=demo";
				Cache.addSearch('demo');
				
				$.ajax({
					type: "GET",
					url: apiUrl
				}).done(function(notes) { 
					 Cache.addNotes(notes);
					 displayNotesInRelationToUser();
					 showLastSearch();
				});
				return false;
			}
			
			return true;
		}
		
		function setUserAddress(){
			
			var settings = Cache.getUserSettings();
			
			if(typeof(settings.userAddress) === 'undefined')
			{	
				if (navigator.geolocation)
				{
				    navigator.geolocation.getCurrentPosition(
					function(position){
						Location.address(position.coords.latitude,position.coords.longitude);
					});
				}
			}
		}
		
		function showLastSearch(){
			$('#lastsearch').val(Cache.getLastSearch());
		}
		
		function showUserSettings(){
			settings = Cache.getUserSettings();
			$('#locationAddress').val(settings.userAddress);
			$('#updateFrequency').val(settings.updateFrequency);
		}
		
		function showUserLocation(){
			settings = Cache.getUserSettings();
			$('#yourlocation').val(settings.userAddress);
		}
		
		function showMessage(message){
			$("<div class='ui-loader ui-overlay-shadow ui-body-e ui-corner-all'><h1><strong>"+message+"</strong></h1></div>")
			.css({ "display":"block", "opacity":0.96, "top": $(window).scrollTop() + 100 })
			.appendTo( $("body") )
			.delay( 2500 )
			.fadeOut( 400, function(){
			    $(this).remove();
			});
		}
		
		function fetchNotesInCache(){
			
			notes = Cache.getNotes();
			
			if((notes.length >0) && Cache.isCurrent()) {
				displayNotesInRelationToUser();
			}
		}
		
		function userAddress(){
			return Cache.getUserAddress();
		}
		
		function updateSettings()
		{
			var settings = {
				userAddress: $('#locationAddress').val(),
				updateFrequency : $('#updateFrequency').val()
			};
			
			Cache.addUserSettings(settings);
			showUserSettings();
			displayNotesInRelationToUser();
		}
		
		function fetchFilteredNotes(e) {

			e.preventDefault();
			
			var filterString = $("#searchNotes").serialize();
			apiUrl = "api/index.php/note.json/filter/"+filterString;
			Cache.addSearch($('#locationfilter').val());
			
			$.ajax({
				type: "GET",
				url: apiUrl
			}).done(function(notes) { 
				 Cache.addNotes(notes);
				 displayNotesInRelationToUser();
				 showLastSearch();
			});
			
			return false;
		}
		
		function refreshStoredNotes() {
			Cache.clearNotes();
			fetchFilteredNotes();
		}
		
		function displayNotesInRelationToUser()
		{
			$('#noteslist').empty();
			notes = Cache.getNotes();
			
			if (navigator.geolocation)
			{
				
				
			    navigator.geolocation.getCurrentPosition(
			        function(position){
					$.each(notes, function(i, note)
					{
						console.log(note);
						var dist = Location.distanceFromUser(note,position.coords.latitude,position.coords.longitude);
						
						/*if(note.address == ''){
							Location.addressForNote(note);
						}*/
						
						NoteItemView.addNote(note,dist, "#noteslist");
					});
			        },
				function(error) {
					showNotesWithUnknownDistance(notes);	
				},
				{
					maximumAge:Infinity,
					timeout:5000
				});
			}else{
				showNotesWithUnknownDistance(notes);
			}
			
			if($('#noteslist').length < 1){
				showNotesWithUnknownDistance(notes);
			}
		}
		
		/**
		 * We can't calculate the distance so tell people
		 */
		function showNotesWithUnknownDistance(notes){
			$.each(notes, function(i, note)
			{	
				NoteItemView.addNote(note,"??", "#notes");
			});	
		}
		
		function showLocation(e){
			
			e.preventDefault();
			var canvas = "#map_canvas";
			var mapId = $(this).attr("id");
			var id =mapId.split("_")[1];
			var note = Cache.getNote(id);
			
			$(canvas).css("display","block");
			Location.getMap(note,canvas);
			
			$('.back-to-note').attr('href','#note_'+id);
			
			$('html,body').animate({scrollTop: $('#map').offset().top},'slow');
		}
		
		function displayBookmarks() {

			//clear first
			$('#bookmarkslist').empty();
			var favs = Cache.getFavourites();
			
			if(favs.length >0)
			{
				$.each(favs, function(i, fav) {
					var distance = "??";
					NoteItemView.addNote(fav,distance, "#bookmarkslist");
				});
			}
			
		}
		
		function completeAndSaveNote(e){
			
			e.preventDefault();
			
			var address = $('#address').val();
			var geocoder = new google.maps.Geocoder();
			
			geocoder.geocode( { 'address': address}, function(results, status) {
				if (status == google.maps.GeocoderStatus.OK) {  
					latLong = results[0].geometry.location.toString();
					$("#latitude").val(results[0].geometry.location.lat());
					$("#longitude").val(results[0].geometry.location.lng());
					var formData = $("#addNoteForm").serialize();
					console.log(formData);
					Note.add(formData);
				}else{
					var formData = $("#addNoteForm").serialize();
					console.log(formData);
					Note.add(formData);
					
				}
			});
		}
		
		function saveEditedNote(e) {
			e.preventDefault();
			var formData = $("#editNoteForm").serialize();
			console.log(formData);
			Note.edit(formData);
		}
		
		function bookmarkNote() {
			var btnId = $(this).attr("id");
			var noteId =btnId.split("_")[1];
			console.log('bookmark for '+noteId);
			var favNote = Cache.getNote(noteId);
			Cache.addFavourite(favNote);
		}
		
		function getComments(e){

			e.preventDefault();
			
			var btnId = $(this).attr("id");
			var noteId =btnId.split("_")[1];
			
			apiUrl = "api/index.php/note.json/comments/"+noteId;
			
			console.log('Comments for '+noteId);
			
			$.ajax({
				type: "GET",
				url: apiUrl
			}).done(function(comments) {
				$.each(comments, function(i, comment)
				{
					NoteItemView.addComment(comment, "#commentslist");
				});
			});
			
			$('#addCommentForm #userID').val('2');
			$('#addCommentForm #noteID').val(noteId);
			
			$('html,body').animate({scrollTop: $('#comments').offset().top},'slow');
			
			return false;
		
		}
		
		function saveNoteComment(e){

			e.preventDefault();
			var commentData = $("#addCommentForm").serialize();
			console.log(commentData);
			Note.addComment(commentData);
			return false;
		}
		
		function removeNoteBookmark(id) {
			$(id).find('span.ui-btn-text').text("Add");

			var noteId =id.split("_")[1];
			Cache.removeFavourite(noteId);
			showMessage("Removed from favourites");
		}
		
		function filterNotesByTag(e) {
			
			e.preventDefault();
					
			var tagId = $(this).attr("id");
			var tagName =tagId.split("_")[1];
			console.log(tagName);
			$('.filterinput').val(tagName);
			$('.filterinput').trigger('change');
			$('html,body').animate({scrollTop: $('#places').offset().top},'slow');
		}
		
		function displayAccountNotes() {
			notes = Cache.getAccountNotes();

			if((notes.length >0) && Cache.isCurrent()) {
				setupAccountNotes(notes);
			} else {
				apiUrl = "api/index.php/note.json";

				$.ajax({
					type: "GET",
					url: apiUrl,
					success: setupAccountNotes
				});
			}
		}
		
		function setupAccountNotes(notes) {
			//clear first
			$('#account_notes').empty();
			Cache.addAccountNotes(notes);

			$.each(notes, function(i, note) {
			   AccountNoteItemView.addNote(note, "#account_notes");
			});
		}
		
		function editAccountNote(e) {
			e.preventDefault();
			var Id = $(this).attr("id");
			var noteId = Id.split("_")[1];
			var noteToEdit = Cache.getNote(noteId);
			EditNoteView.setDetail(noteToEdit);
			
			$('html,body').animate({scrollTop: $("#edit").offset().top},'slow');
		}
		
		//custom filter
		jQuery.expr[':'].IgnoreCaseContains = function(a,i,m){
			return (a.textContent || a.innerText || "").toUpperCase().indexOf(m[3].toUpperCase())>=0;
		};
		
		function addListFilter(header, list) {
			
			var form = $("<form>").attr({"class":"filterform","action":"#"}),
			    input = $("<input>").attr({"class":"filterinput","type":"text", "placeholder":"Filter places ..."});
			$(form).append(input).appendTo(header);
		    
			$(input)
			  .change( function () {
			    var filter = $(this).val();
				if(filter) {	
					$('#noteslist > li:not(:IgnoreCaseContains(' + filter + '))').hide(); 
					$('#noteslist > li:IgnoreCaseContains(' + filter + ')').show();
				}
			    
			    return false;
			  }).keyup( function () {
			    $(this).change();
			});
		}
		
		return{
			editAccountNote:editAccountNote,
			setupAccountNotes:setupAccountNotes,
			displayAccountNotes:displayAccountNotes,
			removeNoteBookmark:removeNoteBookmark,
			bookmarkNote:bookmarkNote,
			saveEditedNote:saveEditedNote,
			displayBookmarks:displayBookmarks,
			displayNotesInRelationToUser:displayNotesInRelationToUser,
			refreshStoredNotes:refreshStoredNotes,
			fetchFilteredNotes:fetchFilteredNotes,
			filterNotesByTag:filterNotesByTag,
			init:init,
			completeAndSaveNote:completeAndSaveNote,
			updateSettings:updateSettings,
			refreshStoredNotes:refreshStoredNotes,
			showMessage:showMessage,
			showLocation:showLocation,
			getComments:getComments,
			saveNoteComment:saveNoteComment
		};
	}();
	/**
	 * Caching for favourites and users events
	 */
	var Cache = function() {

		var FAVOURITE_NOTES = "favourite_notes";
		var USER_SETTINGS = "user_settings";
		var LAST_SEARCH = "last_search";
		var NO_ADDRESS = "Area Unknown";
		var NOTES = "notes";
		var NOTES_LAST_UPDATED = "notes_last_updated";

		function init() {
			if (!localStorage[FAVOURITE_NOTES]) {
				localStorage[FAVOURITE_NOTES] = JSON.stringify([]);
			}
			if (!localStorage[NOTES]) {
				localStorage[NOTES] = JSON.stringify([]);
			}
			if (!localStorage[USER_SETTINGS]) {
				localStorage[USER_SETTINGS] = JSON.stringify([]);
			}
		}
		
		function isCurrent() {

			var today = new Date();
			var lastUpdate = new Date(localStorage[NOTES_LAST_UPDATED]);
			//Set 1 day in milliseconds
			var one_day=1000*60*60*24

			//Calculate difference btw the two dates, and convert to days
			var numberOfDays = Math.ceil((lastUpdate.getTime()-today.getTime())/(one_day));

			return(numberOfDays < 7 );

		}
		
		function addUserSettings(settings){
			localStorage[USER_SETTINGS] = JSON.stringify(settings);
		}
		
		function getUserSettings(){
			return jQuery.parseJSON(localStorage[USER_SETTINGS]);
		}
		
		function addSearch(search){
			localStorage[LAST_SEARCH] = search;
		}
		
		function getLastSearch(){
			return localStorage[LAST_SEARCH];
		}
		
		function addFavourite(note) {
			var favs = getFavourites();
			favs.push(note);
			localStorage[FAVOURITE_NOTES] = JSON.stringify(favs);
		}
		
		function removeFavourite(noteId) {
			favs = getFavourites();

			var key = '';
			for(i in favs) {
				if(favs[i].id === noteId) {
					key = i;
					break;
				}
			}

			favs.splice(key,1);

			localStorage[FAVOURITE_NOTES] = JSON.stringify(favs);

		}
		
		function getFavourites() {
			
			if(localStorage[FAVOURITE_NOTES]) {

				var favs = jQuery.parseJSON(localStorage[FAVOURITE_NOTES]);

				if(favs.length > 1) {
					favs.sort( function(a, b) {
						if (a.id < b.id)
							return -1;
						if (a.id > b.id)
							return 1;
						return 0;
					});
				}
				return favs;
			}
			return new Array();
		}
		
		function clearFavourites(){
			localStorage[FAVOURITE_NOTES] = JSON.stringify([]);
		}
		
		function userAddressNotSet(){
			var settings = getUserSettings();
			if(typeof(settings.userAddress) === 'undefined' || settings.userAddress == NO_ADDRESS){
				return true;
			}
			return false;
		}
		
		function addNotes(notes) {
			clearNotes();
			localStorage[NOTES_LAST_UPDATED] = new Date();
			localStorage[NOTES] = JSON.stringify(notes);
		}
		
		function clearNotes() {
			localStorage[NOTES] = JSON.stringify([]);
		}
		
		function getNotes() {
			return jQuery.parseJSON(localStorage[NOTES]);
		}
		
		function getNote(id) {
			
			notes = getNotes();
			var noteToGetId = parseInt(id);
			var key = '';
			for(i in notes) {
				if(notes[i].id == noteToGetId) {
					key = i;
					break;
				}
			}

			return notes[key];
		}
		
		return{
			isCurrent:isCurrent,
			init:init,
			getNotes:getNotes,
			getNote:getNote,
			clearNotes:clearNotes,
			addNotes:addNotes,
			getFavourites:getFavourites,
			removeFavourite:removeFavourite,
			addFavourite:addFavourite,
			addSearch:addSearch,
			getLastSearch:getLastSearch,
			addUserSettings:addUserSettings,
			getUserSettings:getUserSettings,
			userAddressNotSet:userAddressNotSet
		};
		
	}();
	
	/**
	 * Map functionality
	 */
	var Location = function() {
		
		function distanceFromUser(note,userLatitude,userLongitude)
		{	
			var earthsRadius = 6371; // Radius of the earth in km
			var differenceInLat = toRad(note.latitude-userLatitude);  // Javascript functions in radians
			var differenceInLng = toRad(note.longitude-userLongitude); 
			var a = Math.sin(differenceInLat/2) * Math.sin(differenceInLat/2) +
			        Math.cos(toRad(note.longitude)) * Math.cos(toRad(userLongitude)) * 
			        Math.sin(differenceInLng/2) * Math.sin(differenceInLng/2); 
			var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
			var distance = Math.round(earthsRadius * c); // Distance in km
			return distance;
		}
		
		/**
		 * Approx location
		 */
		function address(userLatitude,userLongitude)
		{
 			if(Cache.userAddressNotSet()){
			
				var geocoder = new google.maps.Geocoder();
				var latlng = new google.maps.LatLng(userLatitude, userLongitude);
				
				geocoder.geocode({'latLng': latlng}, function(results, status) {
					if (status == google.maps.GeocoderStatus.OK) {
						if (results[1]) {
							console.log(results[1].formatted_address);
							
							var settings = Cache.getUserSettings();
							
							var updatedSettings = {
								userAddress: results[1].formatted_address,
								updateFrequency : settings.updateFrequency
							};
							
							Cache.addUserSettings(updatedSettings);
						} 
					} //Nothing to do otherwise
				});
			}
		}
		
		function getMap(note,canvas)
		{
			var mapOptions = {
				center: new google.maps.LatLng(note.latitude, note.longitude),
				zoom: 16,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			};
			var map = new google.maps.Map($(canvas)[0],mapOptions);
			
			var marker = new google.maps.Marker({
				position: new google.maps.LatLng(note.latitude, note.longitude),
				map: map,
				title:note.name
			});
			
			marker.info = new google.maps.InfoWindow({
				content: note.name
			});
			

			google.maps.event.addListener(marker, 'click', function() {
				marker.info.open(map, marker);
			});
			
			google.maps.event.trigger(marker, 'click');
		}
		
		function addressForNote(note)
		{
 			
			var geocoder = new google.maps.Geocoder();
			var latlng = new google.maps.LatLng(note.latitude, note.longitude);
				
			geocoder.geocode({'latLng': latlng}, function(results, status) {
				if (status == google.maps.GeocoderStatus.OK) {
					if (results[0]) {
						console.log(results[0].formatted_address);
						
						var apiUrl = "api/index.php/note/address/"+note.id+"/"+results[0].formatted_address;
						$.ajax({
						type: "PUT",
						url: apiUrl
						});
					}
				} //Nothing to do otherwise
			});
		}
		
		/**
		* Converts numeric degrees to radians
		*/
		function toRad(Value)
		{
		    return Value * Math.PI / 180;
		}
		
		return{
			distanceFromUser:distanceFromUser,
			address:address,
			getMap:getMap,
			addressForNote:addressForNote
		};
		
	}();
	
	/**
	 * Note functionality
	 */
	var Note = function() {

		function add(noteData) {

			var apiUrl = "api/index.php/note.json";

			$.ajax({
				type: "POST",
				url: apiUrl,
				data: noteData,
				success: addedMessage
			});
		}
		
		function addComment(commentData) {

			var apiUrl = "api/index.php/note.json/comment";

			$.ajax({
				type: "POST",
				url: apiUrl,
				data: commentData,
				success: addedMessage
			});
		}
		
		function edit(noteData) {
			
			var apiUrl = "api/index.php/note";
			console.log(noteData);
			$.ajax({
				type: "PUT",
				url: apiUrl,
				data: noteData,
				success: editedMessage
			});
		}
		function addedMessage() {
			Controller.showMessage("Thanks, your note has been added");
		}
		function editedMessage() {
			Controller.showMessage("Thanks, your note has been updated");
		}
		
		return{
			add: add,
			edit:edit,
			addComment:addComment
		};
		
	}();
	
	var NoteItemView = function() {
		
		function addComment(comment,commentList){
			var commentItem = '<li><blockquote><p><i class="icon-comment"> </i> ' + comment.comment + '</p></blockquote>';
			commentItem += '<p><i class="icon-user"> </i> ' + comment.user + '</p></li>';
			$(commentList).append(commentItem);
		}

		function addNote(note, distance,noteList) {
			
			var tags = note.tags.split(",");
			
			noteItem = '<li><div id="note_'+note.id+'" class="note">';
			noteItem += '<div class="six columns">';
				noteItem += '<h5>' + note.name + '</h5>';
				noteItem += '<blockquote><p>' + note.description + '</p></blockquote>';
			noteItem += '</div>';
			noteItem += '<div class="six columns">';
				noteItem += '<p >' + note.address + '</p>';
				noteItem += '<p>';
				for (tag in tags){
					tagLink = $.trim(tags[tag]);
					noteItem += '<span class="tags"><em class="button" id="tag_'+tagLink+'"><i class="icon-tag"> </i>'+tagLink+' </em></span>';
				}
				noteItem += '</p>';
				noteItem += '<p><em>'+note.rating+'<i class="icon-star"></i></em></p><p><em><strong>'+distance+'km</strong> away</em></p>';
			noteItem += '</div>';
			noteItem += '<div class="two columns">';
	
				noteItem += addMenu(note);
			noteItem += '</div>';
			noteItem += '</div><hr /></li>';
			
			$(noteList).append(noteItem);
		}
		
		function addMenu(note){
			var menu ='<div class="btn-group">';
			menu +='<a class="button full-width" id="map_'+note.id+'" ><i class="icon-map-marker"></i> Show Map</a>';
			menu += '<a class="button full-width" id="comment_'+note.id+'" ><i class="icon-comments"></i> Comments</a>';
			menu += '<a class="button full-width" id="fav_'+note.id+'" ><i class="icon-heart"></i> Bookmark</a>';
			menu += '<a class="button full-width" id="edit_'+note.id+'"><i class="icon-edit"></i> Update</a>';
			menu += '</div>';
			return menu;
		}
		
		return{
			addNote: addNote,
			addComment:addComment
		};
	}();
	
	var EditNoteView = function() {

		function setDetail(note) {
			$('#editNoteForm #id').val(note.id);
			$('#editNoteForm #name').val(note.name);
			$('#editNoteForm #tags').val(note.tags);
			$('#editNoteForm #address').val(note.address);
			$('#editNoteForm #description').val(note.description);
			$('#editNoteForm #rating').val(note.rating);
			$('#editNoteForm #latitude').val(note.latitude);
			$('#editNoteForm #longitude').val(note.longitude);
			
		}
		
		return{
			setDetail:setDetail	
		};
	}();
	var AddNoteView = function() {

		function setLocationDetail(position) {
			
			if(position){
				$('#addNoteForm #latitude').val(position.coords.latitude);
				$('#addNoteForm #longitude').val(position.coords.longitude);
			}
		}
		
		return{
			setLocationDetail:setLocationDetail	
		};
	}();
	var AccountNoteItemView = function() {

		function addNote(note, noteList) {
			
			var tags = note.tags.split(",");
			
			noteItem = '<li><a id="accountnote_'+note.id+'" href="#edit">';
			noteItem += '<h4><i class="icon-edit"></i> ' + note.name + '</h4>';
			
			noteItem += '<p><i class="icon-tags"></i>';
			for (tag in tags){
				tagLink = $.trim(tags[tag]);
				noteItem += '<span class="tags"><em>'+tagLink+'</em></span>';
			}
			noteItem += '</p>';
			noteItem += '<p>' + note.description + '</p>';
			noteItem += '</a></li>';

			$(noteList).append(noteItem);
			$(noteList).listview("refresh");
		}
		
		return{
			addNote:addNote	
		};
	}();
	