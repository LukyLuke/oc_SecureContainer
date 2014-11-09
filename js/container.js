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
 * 
 * TODO: Add a possibility to reenter the passphrase and verify it.
 * TODO: Maybe an option to change the passphrase?
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
		 * The current selected entry ID
		 */
		_activeItem: null,
		
		/**
		 * Current passphraseto use for decryption.
		 */
		_activePassphrase: null,
 
		/**
		 * The main navigation container
		 */
		$el: null,
 
		/**
		 * The current dialog id which holds the encrypted data.
		 */
		_decryptDialogId: -1,

		/**
		 * State if there is a Drag'n'Drop action in progress or not
		 */
		_dragndropActive: false,
 
		/**
		 * Internal state variable to define if the mouse-position should be catched
		 */
		_catchMouseMove: false,
 
		/**
		 * Internal use for the mousePosition on drag'n'drop
		 */
		_mousePosition: null,
 
		/**
		 * For Drag'n'Drop, use this for the cloned element.
		 */
		_clonedItem: null,

		/**
		 * Initializes the navigation from the given container
		 * 
		 * @param $el element containing the navigation
		 */
		initialize: function($el) {
			this.$el = $el;
			this._activePassphrase = null;
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
			// Events for replace and update content entries
			this.on('replace', _.bind(this._replaceContent, this));
			this.on('insert', _.bind(this._insertContent, this));
			
			this.on('openPassphraseDialog', _.bind(this._showPassphraseDialog, this))
			this.on('clearPassphrase', _.bind(function() {
				this._activePassphrase = null;
				this.trigger('passphraseUnset', null);
			}, this));
			this.on('passphraseSet', _.bind(function() {
				if (this._activeItem != null) {
					$('.secure-entry-function.secure-entry-decrypt', this._activeItem).trigger('click');
				}
			}, this));
			
			this.on('clear', _.bind(function() {
				this.$el.empty();
			}, this));
			
			this.on('delete', _.bind(function(ev) {
				ev.stopImmediatePropagation();
				$('#entry-' + ev.eventData.guid).remove();
			}, this));
			
			// Events for Drag'n'Drop
			this.on('dragAndDrop', _.bind(this._mouseMoveEvent, this));
			this.on('cancelDragAndDrop', _.bind(function() {
				this._catchMouseMove = false;
				if (this._clonedItem !== null) {
					this._clonedItem.remove();
					this._clonedItem = null;
				}
			}, this));
			$(document).on('mouseup', _.bind(function() {
				this._catchMouseMove = false;
				if (this._clonedItem != null) {
					this.trigger('dragAndDropEnd', this._clonedItem.data('id'));
					$(this._clonedItem).remove();
					this._clonedItem = null;
					
					// Becasue the moseEnter/MouseMove/... is not triggered in navigation
					// when we drag an element, we have to catch the mouseenter event which
					// is fired after the mouseup event here. Therefore it can happen that
					// when the mouseup is fired not on a path, that the mouseenter event
					// there is fired later and an entry is moved. So we cancel the dragndrop
					// action after 100ms to prevent this unwanted move...
					setTimeout(_.bind(function() {
						this.trigger('cancelDragAndDrop');
					}, this), 100);
				}
			}, this));
			$(window).on('mousemove', _.bind(function(ev) {
				if (this._catchMouseMove) {
					this._mousePosition = {
						x: ev.pageX,
						y: ev.pageY
					};
					this.trigger('dragAndDrop', this._clonedItem);
				}
			}, this));
		},
 
		/**
		 * Called each time on mousemove after the _mousePosition was set
		 */
		_mouseMoveEvent: function() {
			if (this._clonedItem !== null) {
				if (this._clonedItem.data('attached') === false) {
					this._clonedItem.data('attached', true);
					$('#content-wrapper').append(this._clonedItem);
				}
				var offset = this._clonedItem.offset(), pos = this._clonedItem.data('mouse');
				this._clonedItem.css({
					top: offset.top + this._mousePosition.y - pos.y,
					left: offset.left + this._mousePosition.x - pos.x
				});
				this._clonedItem.data('mouse', this._mousePosition);
			}
		},
 
		/**
		 * Inserting all content from the event data on the bottom of the container
		 * 
		 * @param Object ev The triggered Event
		 */
		_insertContent: function(ev) {
			// If we create a new entity, we get it back as the 
			$.each(ev.eventData, _.bind(function(k, entry) {
				// Create the entry
				var $entry = $('<section class="secure-entry secure-zebra-' + (k%2 ? 'even' : 'odd') + '" id="entry-' + entry.id + '"></section>');
				var $name = $('<div class="secure-entry-name">' + ((entry.name === null) || (entry.name === '') ? t('secure_container', 'Name not set') : entry.name) + '</div>');
				var $description = $('<div class="secure-entry-description">' + ((entry.description === null) || (entry.description === '') ? '...' : entry.description) + '</div>');
				var $functions = $('<nav class="secure-entry-functions"></nav>');
				
				$functions.append($('<div class="secure-entry-function secure-entry-decrypt icon-password svg">' + t('secure_container', 'Decrypt') + '</div>'));
				$functions.append($('<div class="secure-entry-function secure-entry-delete icon-delete svg">' + t('secure_container', 'Delete') + '</div>'));
				
				$entry.data('name', (entry.name === null ? '': entry.name));
				$entry.data('description', (entry.description === null ? '' : entry.description));
				$entry.data('encrypted', (entry.value === null ? '' : entry.value));
				$entry.append($name).append($description).append($functions);
				this.$el.append($entry);
				
				// Bind events to edit and show the decrypted value
				$entry.on('click', '.secure-entry-name', _.bind(this._onClickName, this));
				$entry.on('click', '.secure-entry-description', _.bind(this._onClickDescription, this));
				$entry.on('click', '.secure-entry-decrypt', _.bind(this._onClickDecrypt, this));
				$entry.on('click', '.secure-entry-delete', _.bind(this._onClickDelete, this));
				
				// Event for Drag'n'Drop to a different section
				$entry.on('mousedown', _.bind(function(ev) {
					var offset = $entry.offset(), width = $entry.width();
					this._catchMouseMove = true;
					this._clonedItem = $entry.clone();
					this._clonedItem.on('mousemove', function() { return false; });
					this._clonedItem.find('nav').remove();
					this._clonedItem.find('.secure-container-encrypted').remove();
					this._clonedItem.addClass('drag-n-drop');
					this._clonedItem.data('attached', false);
					this._clonedItem.data('mouse', { x: ev.pageX, y: ev.pageY });
					this._clonedItem.data('id', $entry.attr('id').replace(/entry\-/, ''));
					this._clonedItem.attr('id', $entry.id + '-clone');
					this._clonedItem.css({
						width: width,
						top: offset.top,
						left: offset.left
					});
				}, this));
			}, this));
		},
 
		/**
		 * Replaces one content which is identified by the id dataproperty
		 * 
		 * @param Object ev The triggered Event
		 */
		_replaceContent: function(ev) {
			if (ev.eventData.id !== undefined) {
				var $base = $('#entry-' + ev.eventData.id);
				
				if (ev.eventData.name !== undefined) {
					$('.secure-entry-name', $base).text(ev.eventData.name);
					$base.data('name', ev.eventData.name);
				}
				if (ev.eventData.description !== undefined) {
					$('.secure-entry-description', $base).text(ev.eventData.description);
					$base.data('description', ev.eventData.description);
				}
				if (ev.eventData.value !== undefined) {
					$base.data('value', ev.eventData.value);
				}
				
				// See below: Opacity is decreased when save some data
				$base.animate({
					opacity: 1
				}, 500);
			}
		},
 
		/**
		 * Delete the currently selected entry after a request if this is wanted
		 * 
		 * @param Object ev The triggered Event
		 */
		_onClickDelete: function(ev) {
			var $target = $(ev.currentTarget);
			this._activeItem = $target.parent().parent();
			
			var $dialog = OC.dialogs.confirm(t('secure_container', 'You really want delete this entry?'), t('secure_container', 'Delete selected Entry?'), _.bind(function(ok, value) {
				if (ok) {
					this.trigger('deleteContent', {
						id: this._activeItem.attr('id').replace(/entry\-/, '')
					});
					this._activeItem = null;
				}
			}, this), true);
		},

		/**
		 * Event handler for when clicking on a name to show an edit field.
		 * 
		 * @param Object ev The triggered Event
		 */
		_onClickName: function(ev) {
			if (this._dragndropActive) {
				return;
			}

			var $target = $(ev.currentTarget);
			this._activeItem = $target.parent();
			var $edit = $('<input type="text" />').val(this._activeItem.data('name'));
			
			$target.empty().append($edit);
			$edit.on({
				blur: _.bind(function(ev) {
					ev.stopImmediatePropagation();
					this._activeItem.data('name', $edit.val());
					$target.empty().text(this._activeItem.data('name'));
					this._saveEncrypted();
				}, this),
				keydown: _.bind(function(ev) {
					if (ev.which == 13) {
						ev.stopImmediatePropagation();
						this._activeItem.data('name', $edit.val());
						$target.empty().text(this._activeItem.data('name'));
						this._saveEncrypted();
					}
				}, this),
				click: function(ev) {
					ev.stopImmediatePropagation();
				},
			});
			$edit.focus();
		},

		/**
		 * Event handler for when clicking on a description to show an edit field
		 * 
		 * @param Object ev The triggered Event
		 */
		_onClickDescription: function(ev) {
			if (this._dragndropActive) {
				return;
			}

			var $target = $(ev.currentTarget);
			this._activeItem = $target.parent();
			var $edit = $('<textarea style="width:auto;height:auto;" />').val(this._activeItem.data('description'));
			
			$target.empty().append($edit);
			$edit.on({
				blur: _.bind(function(ev) {
					ev.stopImmediatePropagation();
					this._activeItem.data('description', $edit.val());
					$target.empty().text(this._activeItem.data('description'));
					this._saveEncrypted();
				}, this),
				click: function(ev) {
					ev.stopImmediatePropagation();
				}
			});
			$edit.focus();
		},

		/**
		 * Event handler for when clicking on the decrypt icon
		 * 
		 * Try to decrypt the value.If this goes wrong, a PassphraseDialogOpenedException
		 * is thrown which shows the Passphrase Dialo*g. This Dialog fires the 'passphraseSet'
		 * event which the calls this function again.
		 * 
		 * If the value could be decrypted, it will be shown in a row below the current entry.
		 * 
		 * @param Object ev The triggered Event
		 */
		_onClickDecrypt: function(ev) {
			var value, $target = $(ev.currentTarget).parent().parent();
			this._activeItem = $target;

			// Hide the decrypted container if there is already one
			var $crypt = $('.secure-container-encrypted', $target);
			if ($crypt.length > 0) {
				$crypt.remove();
				$(ev.currentTarget).text(t('secure_container', 'Decrypt'));
				return;
			}

			try {
				value = this._decryptText($target.data('encrypted'));
				$(ev.currentTarget).text(t('secure_container', 'Hide decrypted'));
			} catch (ex) {
				return;
			}

			// The value could be decrypted, append a new element in _activeItem with it
			$crypt = $('<div class="secure-container-encrypted">' + value + '</div>');
			$target.append($crypt);

			// Show the edit field by click on the crytped value container
			$crypt.on('click', _.bind(function(ev) {
				// Don't do anything if there is already a textarea in this container
				if ($('textarea', ev.currentTarget).length > 0) {
					return;
				}

				// Create the textarea,append and focus it.
				value = this._decryptText($target.data('encrypted'));
				var $edit = $('<textarea />');
				$crypt.empty().append($edit).addClass('decrypted');
				$edit.val(value).data('original', value).focus();

				// Prevent some gobally registered events on textareas which prevent us
				// on resizing the textarea
				$edit.on('click', function(ev) { ev.stopImmediatePropagation(); });

				// Append a submit button to enctrypt and save the new value
				var $btn1 = $('<button class="submit">' + t('secure_container', 'Save') + '</button>');
				$crypt.append($btn1);
				$btn1.on('click', _.bind(function(ev) {
					ev.stopImmediatePropagation();
					var value = $edit.val(), enc = this._encryptText(value);
					this._activeItem.data('encrypted', enc);
					$crypt.removeClass('decrypted');
					$crypt.empty().text(value);
					this._saveEncrypted();
				}, this));

				// Append a cancel button to cancel the edit process
				var $btn2 = $('<button class="cancel">' + t('secure_container', 'Cancel') + '</button>');
				$crypt.append($btn2);
				$btn2.on('click', _.bind(function(ev) {
					ev.stopImmediatePropagation();
					var value = $edit.data('original');
					$crypt.removeClass('decrypted');
					$crypt.empty().text(value);
				}, this));
				$edit.on('keydown', function(ev) {
					if (ev.which == 27) {
						$btn2.trigger('click');
					}
				});
			}, this));
		},

		/**
		 * Encrypt the given text with a global passphrase
		 * 
		 * @param string text Text to encrypt
		 * 
		 * @return string
		 */
		_encryptText: function(text) {
			// If there is no passphrase set, we open up a dialog and throw an exception
			if (this._activePassphrase == null) {
				throw new this.PassphraseDialogOpenedException( this._showPassphraseDialog() );
			}
			return OC_SJCL.sjcl.encrypt(this._activePassphrase, text);
		},

		/**
		 * Decrypt the given text with a global passphrase
		 * 
		 * @param string text Text to decrypt
		 * 
		 * @return string
		 */
		_decryptText: function(text) {
			// If there is no passphrase set, we open up a dialog and throw an exception
			if (this._activePassphrase == null) {
				throw new this.PassphraseDialogOpenedException( this._showPassphraseDialog() );
			}
			try {
				return OC_SJCL.sjcl.decrypt(this._activePassphrase, text);
			} catch(e) {
				if (e.message.substring(0, 11) == 'json decode') {
					return '';
				}
				if (e.message.substring(0, 22) == 'ccm: tag doesn\'t match') {
					throw new this.PassphraseDialogOpenedException( this._showPassphraseDialog() );
				}
			}
		},
 
		/**
		 * Opens a passphrase dialog and returns the deferred object
		 * 
		 * @return Deffered
		 */
		_showPassphraseDialog: function() {
			var message;
			if (this._activePassphrase === null) {
				message = t('secure_container', 'There is currently no passphrase set for the en- and decryption.');
			}
			else {
				message = t('secure_container', 'Wrong Passphrase given, please try it again...');
			}
			
			return OC.dialogs.prompt(message, t('secure_container', 'En-/Decryption Passphrase'), _.bind(function(ok, value) {
				if (ok) {
					this._activePassphrase = value;
					this.trigger('passphraseSet', null);
				}
			}, this), true, t('secure_container', 'Passphrase'), true);
		},

		/**
		 * Simple function used to throw an exception when the Passphrase dialog is opened.
		 * 
		 * @param Deffered deferred The Dialogs deferred object.
		 */
		PassphraseDialogOpenedException: function(deferred) {
			this.deferred = deferred;
			this.message = t('secure_container', 'Passphrase Dialog opened. Enter the Passphrase and redo the action again.');
		},

		/**
		 * Saves the encrypted value from the current entry and closes the dialog
		 */
		_saveEncrypted: function() {
			this.trigger('saveContent', {
				name: this._activeItem.data('name'),
				description: this._activeItem.data('description'),
				value: this._activeItem.data('encrypted'),
				id: this._activeItem.attr('id').replace(/entry\-/, '')
			});
			this._activeItem.css({ opacity: 0.25 });
		},

		last: null
	};
	
	OCA.SecureContainer.Container = Container;
})(jQuery, OC);
