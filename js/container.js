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
				var $entry = $('<section class="secure-entry secure-zebra-' + (k%2 ? 'even' : 'odd') + '" id="entry-' + entry.id + '"></section>');
				var $name = $('<div class="secure-entry-name-cont"><span class="secure-entry-name">' + (entry.name === null ? t('Name not set') : entry.name) + '</span></div>').prepend($('<div class="secure-entry-decrypt icon-password svg"> </div>'));
				var $description = $('<div class="secure-entry-description">' + (entry.description === null ? '...' : entry.description) + '</div>');
				
				$entry.data('name', (entry.name === null ? '': entry.name));
				$entry.data('description', (entry.description === null ? '' : entry.description));
				$entry.data('encrypted', (entry.value === null ? '' : entry.value));
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
			var $target = $(ev.currentTarget);
			this._activeItem = $target.parent().parent();
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
		},

		/**
		 * Event handler for when clicking on a description to show an edit field
		 * 
		 * @param Object ev The triggered Event
		 */
		_onClickDescription: function(ev) {
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
		},

		/**
		 * Event handler for when clicking on the decrypt icon
		 * 
		 * @param Object ev The triggered Event
		 */
		_onClickDecrypt: function(ev) {
			var $target = $(ev.currentTarget), html = $('<div class="secure-container-encrypted">' + "\u066D".repeat(10) + '</div>');
			this._activeItem = $target.parent().parent();
			
			// Open an ocdialog-widget and binds the _closeDialog as the "ok" handler
			var $dialog = OC.dialogs.message(html, t('secure_container', 'Encrypted text'), 'info', OCdialogs.OK_BUTTON, _.bind(this._saveEncrypted, this), true);
			
			// This is triggered when the dialog is shown.
			// Replaces the content with markup and bind to the close event
			$dialog.done(_.bind(function() {
				this._decryptDialogId = OCdialogs.dialogsCounter - 1;
				var $content = $('#oc-dialog-' + this._decryptDialogId + '-content');
				$content.width('auto');
				$content.empty().append(html);
				
				// Show the decrypted text
				$content.on('click', '.secure-container-encrypted', _.bind(this._encryptDecryptDialogValue, this));
				
				// Remove all dialog code after closing
				$content.on('ocdialogclose', _.bind(this._closeDialog, this));
			}, this));
		},

		/**
		 * Encrypt and Decrypt the text from the dialog
		 * Only decrypt the encrypted value if decrypt is an Event, not set or true
		 * 
		 * @param Event|boolean decrypt If true or an event, the alue is decrypted
		 */
		_encryptDecryptDialogValue: function(decrypt) {
			var $target = $('.secure-container-encrypted'), value;
			var decrypt = (decrypt == undefined) || ((typeof(decrypt) == 'object') && (decrypt.originalEvent) && (decrypt.originalEvent instanceof Event)) || (typeof(decrypt) == 'boolean' && decrypt);
			
			try {
				if ($target.hasClass('decrypted')) {
					value = $target.find('textarea').val();
					value = this._encryptText(value);
					this._activeItem.data('encrypted', value);
					$target.removeClass('decrypted');
					$target.empty();
					$target.text("\u066D".repeat(10));
				}
				else if (decrypt) {
					value = this._activeItem.data('encrypted');
					value = this._decryptText(value);
					$target.addClass('decrypted');
					$target.empty();
					$target.append($('<textarea style="width:auto;height:auto;" />'));
					
					// Set the value and prevent defaults to not resize the textarea or close the dialog
					$target.find('textarea').val(value).on({
						click: function(ev) {
							ev.stopImmediatePropagation();
							$target.resize();
						},
						keydown: function(ev) {
							if (ev.which == 13) {
								ev.stopImmediatePropagation();
							}
						}
					});
				}
			} catch (e) {}
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
				return '';
			}
		},
 
		/**
		 * Opens a passphrase dialog and returns the deffered object
		 * 
		 * @return Deffered
		 */
		_showPassphraseDialog: function() {
			return OC.dialogs.prompt(t('secure_container', 'There is currently no passphrase given for the en- and decryption.'), t('secure_container', 'En-/Decryption Passphrase'), _.bind(function(ok, value) {
				if (ok) {
					this._activePassphrase = value;
				}
			}, this), true, t('secure_container', 'Passphrase'), true);
		},

		/**
		 * Simple function used to throw an exception when the Passphrase dialog is opened.
		 * 
		 * @param Deffered deffered The Dialogs deffered object.
		 */
		PassphraseDialogOpenedException: function(deffered) {
			this.deffered = deffered;
			this.message = t('secure_container', 'Passphrase Dialog opened. Enter the Passphrase and redo the action again.');
		},

		/**
		 * Saves the encrypted value from the current entry and closes the dialog
		 */
		_saveEncrypted: function() {
			this._encryptDecryptDialogValue(false);
			console.info(this._activeItem.data('name'));
			console.info(this._activeItem.data('description'));
			console.info(this._activeItem.data('encrypted'));
			
			// TODO: Implement save data
			this._closeDialog();
		},

		/**
		 * Close and destroy the dialog
		 */
		_closeDialog: function() {
			var $target = $('#oc-dialog-' + this._decryptDialogId + '-content');
			$target.ocdialog('destroy');
			$target.remove();
			this._decryptDialogId = -1;
			this._activeItem = null;
		},

		last: null
	};
	
	OCA.SecureContainer.Container = Container;
})(jQuery, OC);
