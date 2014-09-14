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
 * Utility class for secure_container related navigation operations
 */
(function ($, OC) {
	'use strict'

	if (!OCA.SecureContainer) {
		OCA.SecureContainer = {};
	};
	
	var Container = function($el) {
		this.initialize($el);
	};
	
	Container.prototype = {
		/**
		 * Currently selected item in the list
		 */
		_activeItem: null,
 
		/**
		 * The main navigation container
		 */
		$el: null,

		/**
		 * Initializes the navigation from the given container
		 * @param $el element containing the navigation
		 */
		initialize: function($el, $bc) {
			this.$el = $el;
			this._activeItem = null;
			this._setupEvents();
		},

		/**
		 * Adds an event handler
		 *
		 * @param {String} eventName event name
		 * @param Function callback
		 */
		on: function(eventName, callback) {
			this.$el.on(eventName, callback);
		},

		/**
		 * Removes an event handler
		 *
		 * @param {String} eventName event name
		 * @param Function callback
		 */
		off: function(eventName, callback) {
			this.$el.off(eventName, callback);
		},

		/**
		 * Triggers an event for all subscribers
		 * 
		 * @param {String} eventName event name
		 * @param Object data Event data
		 */
		trigger: function(eventName, data) {
			this.$el.trigger(new $.Event(eventName, data));
		},

		/**
		 * Setup UI events
		 */
		_setupEvents: function() {
			//this.$el.on('click', 'article', _.bind(this._onClickItem, this));
		},

		last: null
	};
	
	OCA.SecureContainer.Container = Container;
})(jQuery, OC);