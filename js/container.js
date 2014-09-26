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
		 * @param string eventName event name
		 * @param Function callback
		 */
		on: function(eventName, callback) {
			this.$el.on(eventName, callback);
		},

		/**
		 * Removes an event handler
		 *
		 * @param string eventName event name
		 * @param Function callback
		 */
		off: function(eventName, callback) {
			this.$el.off(eventName, callback);
		},

		/**
		 * Triggers an event for all subscribers
		 * 
		 * @param string eventName event name
		 * @param Object data Event data
		 */
		trigger: function(eventName, data) {
			this.$el.trigger(new $.Event(eventName, { eventData: data }));
		},

		/**
		 * Setup UI events
		 */
		_setupEvents: function() {
			// Event for editing an entry.
			//this.$el.on('click', 'article', _.bind(this._onClickItem, this));
			
			// Events for replace and update content entries
			this.on('replace', _.bind(this._replaceContent, this));
			this.on('insert', _.bind(this._insertContent, this));
			this.on('clear', _.bind(function() {
				this.$el.empty();
			}, this));
		},
 
		/**
		 * Inserting all content from the event data on the bottom of the container
		 * 
		 * @param Object ev The triggered Event
		 */
		_insertContent: function(ev) {
			$.each(ev.eventData, _.bind(function(k, entry) {
				// Create the entry
				var $entry = $('<section class="secure-entry secure-zebra-' + (k%2 ? 'even' : 'odd') + '" id="entry-' + entry.id + '" data-encrypted="' + (entry.value === null ? '' : entry.value) + '"></section>');
				var $name = $('<div class="secure-entry-name-cont"><span class="secure-entry-name">' + entry.name + '</span></div>').prepend($('<div class="secure-entry-decrypt icon-password svg"> </div>'));
				var $description = $('<div class="secure-entry-description">' + (entry.description === null ? '...' : entry.description) + '</div>');
				$entry.append($name).append($description);
				this.$el.append($entry);
				
				// Bind events to edit and show the decrypted value
				$entry.on('click', '.secure-entry-name', _.bind(this._onClickName, this));
				$entry.on('click', '.secure-entry-description', _.bind(this._onClickDescription, this));
				$entry.on('click', '.secure-entry-decrypt', _.bind(this._onClickDecrypt, this));
			}, this));
		},
 
		/**
		 * Replaces one content which is identified by the id dataproperty
		 * 
		 * @param Object ev The triggered Event
		 */
		_replaceContent: function(ev) {
			
		},

		/**
		 * Event handler for when clicking on a name to show an edit field.
		 * 
		 * @param Object ev The triggered Event
		 */
		_onClickName: function(ev) {
			var $target = $(ev.currentTarget), value = $target.text();
			var $edit = $('<input type="text" value="' + value + '" />');
			$target.empty().append($edit);
			// TODO: bind events to submit the value.
		},

		/**
		 * Event handler for when clicking on a description to show an edit field
		 * 
		 * @param Object ev The triggered Event
		 */
		_onClickDescription: function(ev) {
			var $target = $(ev.currentTarget), value = $target.text();
			var $edit = $('<textarea>' + value + '</textarea>');
			$target.empty().append($edit);
			// TODO: bind events to submit the value.
		},

		/**
		 * Event handler for when clicking on the decrypt icon
		 * 
		 * @param Object ev The triggered Event
		 */
		_onClickDecrypt: function(ev) {
			var $target = $(ev.currentTarget);
		},

		last: null
	};
	
	OCA.SecureContainer.Container = Container;
})(jQuery, OC);