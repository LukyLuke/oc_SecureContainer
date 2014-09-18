/**
 * Copyright (c) 2014, Lukas Zurschmiede, http://ranta.ch
 *
 * This file is licensed under the Affero General Public License version 3
 * or later.
 *
 * See the COPYING-README file.
 *
 */

/**
 * Utility class for secure_container related operations
 */
(function ($, OC) {
	'use strict'
	
	if (!OCA.SecureContainer) {
		OCA.SecureContainer = {};
	}

	var App = {
		navigation: null,
		contents: null,
 
		initialize: function() {
			this.navigation = new OCA.SecureContainer.Navigation($('#app-navigation'), $('#controls'));
			this.contents = new OCA.SecureContainer.Container($('#contents'));
			
			this._setupEvents();
		},

		/**
		 * Connects all events
		 */
		_setupEvents: function() {
			this.navigation.on('createSection', _.bind(this._createSection, this));
			this.navigation.on('createContent', _.bind(this._createContent, this));
			this.navigation.on('sectionChanged', _.bind(this._sectionChanged, this));
		},
 
		/**
		 * Event handler for create a new Section aka Path
		 * 
		 * @param Event ev The event object which was triggered
		 */
		_createSection: function(ev) {
			var url = OC.generateUrl('/apps/secure_container/create/new');
			var data = ev.eventData;
			$.ajax(url, {
				type: 'POST',
				data: JSON.stringify(data),
				contentType: 'application/json; charset=UTF-8',
				success: _.bind(this._parseResponse, this),
				dataType: 'json'
			});
		},

		/**
		 * Event handler for create a new Entry
		 * 
		 * @param Event ev The event object which was triggered
		 */
		_createContent: function(ev) {
			var url = OC.generateUrl('/apps/secure_container/save/new');
			var data = ev.eventData;
			data.section = this.navigation.getActiveItem();
			$.ajax(url, {
				type: 'POST',
				data: JSON.stringify(data),
				contentType: 'application/json; charset=UTF-8',
				success: _.bind(this._parseResponse, this),
				dataType: 'json'
			});
		},
 
		/**
		 * Event handler if a section is changed (mostly clicked by the user)
		 * 
		 * @param Event ev event object which was triggered
		 */
		_sectionChanged: function(ev) {
			console.debug('SectionChanged', ev);
		},

		/**
		 * Parse all responses from an AJAX request and runs the defined commands
		 * 
		 * These commands are in most cases events which where called on the
		 * navigation and content objects.
		 * 
		 * @param Object|string response The JSON Response or a string for some reason
		 */
		_parseResponse: function(response) {
			if ((response !== null) && (typeof(response) === 'object')) {
				if (response.navigation) {
					$.each(response.navigation, _.bind(function(key, value) {
						if (value.event && value.data) {
							this.navigation.trigger(value.event, value.data);
						}
					}, this));
				}
				
				if (response.content) {
					$.each(response.content, _.bind(function(key, value) {
						if (value.event && value.data) {
							this.contents.trigger(value.event, value.data);
						}
					}, this));
				}
			} else {
				console.warn('The response was not of type "Object/JSON". Ther was occurred and error on your server or an invalid action was called.');
			}
		},

		_last: null
	};
	OCA.SecureContainer.App = App;
	
	$(document).ready(function() {
		// wait for other apps/extensions to register their event handlers and file actions
		// in the "ready" clause
		_.defer(function() {
			OCA.SecureContainer.App.initialize();
		});




		$('#echo').click(function() {
			var url = OC.generateUrl('/apps/secure_container/echo');
			var data = {
				echo: $('#echo-content').val()
			};

			$.post(url, data).success(function(response) {
				$('#echo-result').text(response.echo);
			});
			
		});
	});

})(jQuery, OC);