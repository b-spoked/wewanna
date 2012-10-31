var app = app ||{};

$(function( $ ) {

	
	
	var Place = Backbone.Model.extend({
		defaults: {
		id:0,
		updated_at : '',
			name: '',
			description: '', 
			address: '',
			rating: 3,
			distance: '??',
			latitude: 0,
			longitude: 0
		}
		
	});
	  
	var PlaceList =  Backbone.Collection.extend({
		locationOfPlace: "",
		typeOfPlace: "",
		model : Place,
		initialize : function(){
			this.storage = new Offline.Storage('places', this, {autoPush:true} );
		},
		url: function () {
			
			var placesUrl = '/api/index.php/note.json';
			
			if(this.locationOfPlace=="" && this.typeOfPlace==""){
				return placesUrl;
			}else{
			
				placesUrl += '/filter/locationfilter='+this.locationOfPlace;
			
				if(this.typeOfPlace){
					placesUrl  += '&typefilter='+this.typeOfPlace;
				}
			
				return placesUrl;
			}
		},
		
		search : function(letters){
			if(letters == "") return this;
	 
			var pattern = new RegExp(letters,"gi");
			return _(this.filter(function(data) {
				return pattern.test(data.get("name")) ||pattern.test(data.get("description"));
			}));
		}
		
	});
	
	var TodosList =  Backbone.Collection.extend({
		model : Place,
		search : function(letters){
			if(letters == "") return this;
	 
			var pattern = new RegExp(letters,"gi");
			return _(this.filter(function(data) {
				return pattern.test(data.get("name")) ||pattern.test(data.get("description"));
			}));
		}
	});
	
	var RecommendedList =  Backbone.Collection.extend({
		model : Place,
		search : function(letters){
			if(letters == "") return this;
	 
			var pattern = new RegExp(letters,"gi");
			return _(this.filter(function(data) {
				return pattern.test(data.get("name")) ||pattern.test(data.get("description"));
			}));
		}
	});

	var Comment = Backbone.Model.extend({
	});
	var CommentList =  Backbone.Collection.extend({
		 placeId : "",
		 model: Comment,
		 url : '/api/index.php/note.json/comments/'+this.placeId,
		 initialize : function(){
			this.storage = new Offline.Storage('www-comments', this, {autoPush: true});
		}
	});
	var User = Backbone.Model.extend({
		defaults: {
		id:0,
		updated_at : '',
		  latitude: 0,
		  longitude: 0,
		  address : '',
		  previousTypeFilter : '',
		  previousLocationFilter: '',
		  todos : new TodosList(),
		  recommended : new RecommendedList()
		},
		
		urlRoot : "api/index.php/user.json",
		
		initialize: function(){
			_.bindAll(this);
			//this.storage = new Offline.Storage('www-user', this);
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(this.onSuccessUpdatePos, 
				                                         this.onFailUpdatePos);
			}
		},

		onSuccessUpdatePos: function(position) {
			
		    this.set({latitude: position.coords.latitude});
			console.log("lat: "+this.get("latitude"));	
			this.set({longitude: position.coords.longitude});			
			console.log("lng: "+this.get("longitude"));
			
			var geocoder = new google.maps.Geocoder();
			var latlng = new google.maps.LatLng(this.get("latitude"), this.get("longitude"));
						
			geocoder.geocode({'latLng': latlng}, this.onSuccessUpdateAddress);
		},
		
		onSuccessUpdateAddress : function(results, status){
			if (status == google.maps.GeocoderStatus.OK) {
					if (results[1]) {
						console.log(results[1].formatted_address);	
						this.set({address: results[1].formatted_address});
					} 
				}//Nothing to do otherwise
		},

		onFailUpdatePos : function(error) {
		    console.log(error);
		}
	});
	app.Places = new PlaceList();
	//app.Bookmarks = new BookmarksList();
	app.UserData = new User();
	app.PlaceView = Backbone.View.extend({

		//... is a list tag.
		tagName:  'li',

		// Cache the template function for a single item.
		template: _.template( $('#place-template').html() ),

		// The DOM events specific to an item.
		events: {
			'keypress .edit': 'updateOnEnter',
			'blur .edit':   'close',
			'click .map' : 'showMap',
			'click .comments' : 'showComments',
			'click .edit' : 'edit',
			'click .bookmark' : 'addBookmark',
			'click .recommend' : 'addRecommendation'
		},

		initialize: function() {
			this.model.on( 'change', this.render, this );
		},

		// Re-render the titles of the todo item.
		render: function() {
			this.$el.html( this.template( this.model.toJSON() ) );
			this.form = this.$('.edit');
			return this;
		},

		// Switch this view into `"editing"` mode, displaying the input field.
		edit: function() {
			$('#edit_' + this.model.id).slideToggle('slow');
		},

		// Close the `"editing"` mode, saving changes to the todo.
		close: function() {
		
			var titleValue = this.$("#edit-title").val().trim();
			var descriptionValue = this.$("#edit-description").val().trim();
			var ratingValue = this.$("#edit-rating").val().trim();
			var addressValue = this.$("#edit-address").val().trim();
			
			this.model.save({ title: titleValue, description: descriptionValue, rating: ratingValue, address: addressValue });
			
			this.$el.removeClass('editing');
		},

		// If you hit `enter`, we're through editing the item.
		updateOnEnter: function( e ) {
			if ( e.which === ENTER_KEY ) {
				this.close();
			}
		},
		
		showMap : function(){
			
			$('#map_' + this.model.id + '_canvas').slideToggle('slow');
			 
			var mapOptions = {
				center: new google.maps.LatLng(this.model.attributes.latitude, this.model.attributes.longitude),
				zoom: 16,
				mapTypeId: google.maps.MapTypeId.ROADMAP
			};
	
			var map = new google.maps.Map($('#map_' + this.model.id + '_canvas')[0],mapOptions);
			
			var marker = new google.maps.Marker({
				position: new google.maps.LatLng(this.model.attributes.latitude, this.model.attributes.longitude),
				map: map,
				title:this.model.title
			});
			
			marker.info = new google.maps.InfoWindow({
				content: this.model.attributes.title
			});
			
			google.maps.event.addListener(marker, 'click', function() {
				marker.info.open(map, marker);
			});
			
			google.maps.event.trigger(marker, 'click');
			
		},
		
		showComments : function(){
			
			$('#comments_' + this.model.id).slideToggle('slow');
			alert('show comments');
		},
		
		addBookmark : function(){
			var bookmarked = app.UserData.get("todos");
			bookmarked.add(this.model);
			app.UserData.set({todos:bookmarked});
		},
		
		addRecommendation : function(){
			app.UserData.recommended.create( this.model );
		}
		
	});
	
	app.SearchView = Backbone.View.extend({

		// Cache the template function for a single item.
		searchTemplate: _.template( $('#search-template').html()),
		
		events: {
			'submit #find-places': 'performSearch',
			'submit #previous-search': 'useExistingSearch'
		},
		
		initialize: function(){
			_.bindAll(this, "render");
			this.model.bind('change:address', this.render);			
		},
		
		render: function() {
			$(this.el).html(this.searchTemplate(this.model.toJSON()));
		},
		close: function() {
			this.remove();
			this.unbind();
		},
		onShow: function() {
			$(this.el).show(500);
		},
		performSearch: function(){
			var locationOfPlace = $("#locationfilter").val().trim();
			var typeofPlace = $("#typefilter").val().trim();
			
			var searchQuery = '#/search/'+locationOfPlace;
			if(typeofPlace){
				searchQuery += '/'+typeofPlace;
			}
			
			AppRouter.navigate(searchQuery);
		},
		
		useExistingSearch: function(){
			var locationOfPlace = $("#previouslocationfilter").val().trim();
			var typeofPlace = $("#previoustypefilter").val().trim();
			
			var searchQuery = '#/search/'+locationOfPlace;
			if(typeofPlace){
				searchQuery += '/'+typeofPlace;
			}
			AppRouter.navigate(searchQuery);
		}
		
	});
	
	app.UserView = Backbone.View.extend({

		// Cache the template function for a single item.
		userTemplate: _.template( $('#user-template').html()),
		
		events:{
			"keyup #filter-todos" : "searchToDos"
		},

		initialize: function() {
			$(this.el).html(this.userTemplate());
			window.app.UserData.get("todos").on( 'add', this.addToDo, this );
			window.app.UserData.get("todos").on( 'reset', this.addAllToDos, this );
			//window.app.User.recommended.on( 'add', this.addRecommended, this );
			//window.app.User.recommended.on( 'reset', this.addAllRecommended, this );
			
		}, 
		
		render: function() {
			
			$(this.el).hide();
		},
		
		close: function() {
			this.remove();
			this.unbind();
		},
		
		onShow: function() {
			this.loadResults();
			$(this.el).show(500);
		},
		
		addToDo: function( place ) {
			var view = new app.PlaceView({ model: place });
			$('#todos-list').append( view.render().el );
		},

		addAllToDos: function(places) {
			
			if(places == null){
				places = window.app.UserData.get("todos");
			}
			
			this.$('#todos-list').html('');
			places.each(this.addToDo, this);
		},
		
		createOnEnter: function( e ) {
			app.Places.create( this.newAttributes() );
			this.form.reset();
		},
		loadResults: function () {
			console.log(window.app.UserData.toJSON());
			this.addAllToDos(window.app.UserData.get("todos"));
			//window.app.UserData.get("todos").fetch();
			
			//window.app.User.recommended.fetch(); 
		},
		searchToDos: function(e){
			var letters = $("#filter-todos").val();
			this.addAll(window.app.UserData.get("todos").search(letters));
		}
		
	});
	
	app.AddPlaceView = Backbone.View.extend({

		// Cache the template function for a single item.
		addPlaceTemplate: _.template( $('#add-template').html()),
		
		render: function() {
			$(this.el).html(this.addPlaceTemplate());
			$(this.el).hide();
		},
		close: function() {
			this.remove();
			this.unbind();
		},
		onShow: function() {
			$(this.el).show(500);
		}
		
	});	  
	app.FoundPlacesView = Backbone.View.extend({

		foundPlacesTemplate: _.template( $('#found-template').html()),
		
		events:{
			"keyup #filter-by" : "search"
		},

		initialize: function() {
			this.form = this.$('#place-info');
			$(this.el).html(this.foundPlacesTemplate());
			
			window.app.Places.on( 'add', this.addOne, this );
			window.app.Places.on( 'reset', this.addAll, this );
			
		}, 
		
		render: function() {
			$(this.el).hide();
		},
		
		close: function() {
			this.remove();
			this.unbind();
		},
		
		onShow: function() {
			this.loadResults();
			$(this.el).show(500);
			$('#add-log').show(500);
		},
		
		addOne: function( place ) {
			
			place.set({distance: this.distanceFromUser(place,app.UserData.get("latitude"),app.UserData.get("longitude"))});
			var view = new app.PlaceView({ model: place });
			$('#places-list').append( view.render().el );
		},
		
		

		addAll: function(places) {
			
			if(places == null){
				places = app.Places;
			}
			
			this.$('#places-list').html('');
			places.each(this.addOne, this);
		},
		
		distanceFromUser : function(place,userLatitude,userLongitude)
		{	
			var earthsRadius = 6371; // Radius of the earth in km
			var differenceInLat = this.toRad(place.get("latitude")-userLatitude);  // Javascript functions in radians
			var differenceInLng = this.toRad(place.get("longitude")-userLongitude); 
			var a = Math.sin(differenceInLat/2) * Math.sin(differenceInLat/2) +
			        Math.cos(this.toRad(place.get("longitude"))) * Math.cos(this.toRad(userLongitude)) * 
			        Math.sin(differenceInLng/2) * Math.sin(differenceInLng/2); 
			var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
			var distance = Math.round(earthsRadius * c); // Distance in km
			return distance;
		},
		
		toRad : function(Value)
		{
		    return Value * Math.PI / 180;
		},
		
		newAttributes: function() {
			return {
				title: $("#title").val().trim(),
				description: $("#description").val().trim(),
				address: $("#address").val().trim(),
				rating: $("#rating").val().trim()
			};
		},
		
		createOnEnter: function( e ) {
			app.Places.create( this.newAttributes() );
			this.form.reset();
		},
		loadResults: function () {
			//app.Places.fetch();
			app.Places.storage.sync.full();
		},
		search: function(e){
			var letters = $("#filter-by").val();
			this.addAll(app.Places.search(letters));
		}
		
	});
	
	var ApplicationRouter = Backbone.Router.extend({

		routes: {
			"":"showSearch",
			"search/:location": "showResults",
			"search/:location/:type": "showResults",
			"places" : "showPlaces",
			"user" : "showUser",
			"addplace" : "showAdd"
		},

		showSearch: function() {
			this.showSelected('');
			RegionManager.show(new app.SearchView({model:app.UserData}));
		},
		showResults: function(location,type) {
			app.Places.locationOfPlace = location;
			app.Places.typeOfPlace = type;
			this.showSelected('places');
			RegionManager.show(new app.FoundPlacesView());
		},
		showPlaces: function( ) {
			this.showSelected('places');
			RegionManager.show(new app.FoundPlacesView());
		},
		showUser: function( ) {
			this.showSelected('user');
			RegionManager.show(new app.UserView());
		},
		showAdd: function( ) {
			this.showSelected('addplace');
			RegionManager.show(new app.AddPlaceView());
		},
		showSelected: function(section){
			$('#filters li a')
			.removeClass('selected')
			.filter('[href="#/' + ( section || '' ) + '"]')
			.addClass('selected');
		}
	});

	RegionManager = (function (Backbone, $) {
		var currentView;
		var el = "#main";
		var region = {};

		var closeView = function (view) {
			if (view && view.close) {
				view.close();
			}
		};
		var openView = function (view) {
			view.render();
			$(el).html(view.el);
			if (view.onShow) {
				view.onShow();
			}
		};
		region.show = function (view) {
			closeView(currentView);
			currentView = view;
			openView(currentView);
		};
		return region;
	})(Backbone, jQuery);
	
	var AppRouter = new ApplicationRouter();
	Backbone.history.start();

});