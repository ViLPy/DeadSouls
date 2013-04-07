/*
 *  Dead souls project
 *
 *  Based on sources from https://code.google.com/p/gritsgame/
 *  Created by Vitaly Lyapin.
 *  License: CC BY-NC-SA 3.0
 */
define(['js/utils'], function(Utils){
	var Input = function(){};
	Input.prototype.init = function(canvas) {
		this.canvas = canvas;
		this.mouseX = 0;
		this.mouseY = 0;

		this.bindings = {};
		this.actions = {};
		this.presses = {};
		this.locks = {};
		this.clicks = {};
		this.delayedKeyup = [];

		canvas.addEventListener('mousemove', Utils.bind(this._mouseMove, this), false);
		canvas.addEventListener('mousedown', Utils.bind(this._mouseDown, this), false);
		canvas.addEventListener('mouseup', Utils.bind(this._mouseUp, this), false);

		window.addEventListener('keydown', Utils.bind(this._keyDown, this), false);
		window.addEventListener('keyup', Utils.bind(this._keyUp, this), false);
	};

    Input.prototype.initTyping = function() {
        for (var i = 'A'.charCodeAt(0); i<='Z'.charCodeAt(0); i++) {
            var ch = String.fromCharCode(i);
            this.bind(this.KEYS[ch], "key" + ch);
        }
    };

	Input.prototype.mousePosition = function(dx, dy) {
		dx = dx || 0;
		dy = dy || 0;
		return {x: this.mouseX - dx, y: this.mouseY - dy};
	};

	Input.prototype._mouseDown = function(event) {
		var button = event.button;
		this._keyDown(event, button == 0 ? this.KEYS.MOUSE1 : this.KEYS.MOUSE2);
	};

	Input.prototype._mouseUp = function(event) {
		var button = event.button;
		this._keyUp(event, button == 0 ? this.KEYS.MOUSE1 : this.KEYS.MOUSE2);
	};

	Input.prototype._mouseMove = function(event) {
		var rect = this.canvas.getBoundingClientRect();
		this.mouseX = event.clientX - rect.left;
		this.mouseY = event.clientY - rect.top;
	};

	Input.prototype._keyDown = function(event, code) {
		if (event.target.type == 'text') {
			return;
		}

		code = code || event.keyCode;

		var action = this.bindings[code];
		if (action) {
			this.actions[action] = true;
			if (event && event.cancelable) event.preventDefault();
			if (!this.locks[action]) {
				this.presses[action] = true;
				this.locks[action] = true;
				this.clicks[action] = true;
			}
		}
	};

	Input.prototype._keyUp = function(event, code) {
		if (event.target.type == 'text') {
			return;
		}

		code = code || event.keyCode;

		var action = this.bindings[code];
		if (action) {
			if (event && event.cancelable) event.preventDefault();
			this.presses[action] = false;
			this.locks[action] = false;
			this.delayedKeyup.push(action);
		}
	};

	Input.prototype.bind = function (key, action) {
		this.bindings[key] = action;
	};

	Input.prototype.unbind = function (key) {
		this.bindings[key] = null;
	};
	//-----------------------------------------
	Input.prototype.unbindAll = function () {
		this.bindings = [];
	};
	//-----------------------------------------
	Input.prototype.state = function (action) {
		return this.actions[action];
	};

	Input.prototype.clearState = function (action) {
		this.actions[action] = false;
	};
	//-----------------------------------------
	Input.prototype.pressed = function (action) {
		return this.presses[action];
	};
	Input.prototype.clicked = function(action) {
		return this.clicks[action];
	};

    Input.prototype.clickedKey = function() {
        for (var key in this.clicks) {
            if (this.clicks[key]) return key.replace("key","");
        }
        return "";
    };

	Input.prototype.clearClicks = function() {
		this.clicks = {};
	};
	//-----------------------------------------
	Input.prototype.clearPressed = function () {
		for (var i = 0; i < this.delayedKeyup.length; i++) {
			var action = this.delayedKeyup[i];
			this.actions[action] = false;
			this.locks[action] = false;
		}
		this.delayedKeyup = [];
		this.presses = {};
	};
	//-----------------------------------------
	Input.prototype.clearAllState = function () {
		this.actions = {};
		this.locks = {};
		this.delayedKeyup = [];
		this.presses = {};
	};

	Input.prototype.KEYS = {
		'MOUSE1': -1,
		'MOUSE2': -3,
		'MWHEEL_UP': -4,
		'MWHEEL_DOWN': -5,

		'BACKSPACE': 8,
		'TAB': 9,
		'ENTER': 13,
		'PAUSE': 19,
		'CAPS': 20,
		'ESC': 27,
		'SPACE': 32,
		'PAGE_UP': 33,
		'PAGE_DOWN': 34,
		'END': 35,
		'HOME': 36,
		'LEFT_ARROW': 37,
		'UP_ARROW': 38,
		'RIGHT_ARROW': 39,
		'DOWN_ARROW': 40,
		'INSERT': 45,
		'DELETE': 46,
		'0': 48,
		'1': 49,
		'2': 50,
		'3': 51,
		'4': 52,
		'5': 53,
		'6': 54,
		'7': 55,
		'8': 56,
		'9': 57,
		'A': 65,
		'B': 66,
		'C': 67,
		'D': 68,
		'E': 69,
		'F': 70,
		'G': 71,
		'H': 72,
		'I': 73,
		'J': 74,
		'K': 75,
		'L': 76,
		'M': 77,
		'N': 78,
		'O': 79,
		'P': 80,
		'Q': 81,
		'R': 82,
		'S': 83,
		'T': 84,
		'U': 85,
		'V': 86,
		'W': 87,
		'X': 88,
		'Y': 89,
		'Z': 90,
		'NUMPAD_0': 96,
		'NUMPAD_1': 97,
		'NUMPAD_2': 98,
		'NUMPAD_3': 99,
		'NUMPAD_4': 100,
		'NUMPAD_5': 101,
		'NUMPAD_6': 102,
		'NUMPAD_7': 103,
		'NUMPAD_8': 104,
		'NUMPAD_9': 105,
		'MULTIPLY': 106,
		'ADD': 107,
		'SUBSTRACT': 109,
		'DECIMAL': 110,
		'DIVIDE': 111,
		'F1': 112,
		'F2': 113,
		'F3': 114,
		'F4': 115,
		'F5': 116,
		'F6': 117,
		'F7': 118,
		'F8': 119,
		'F9': 120,
		'F10': 121,
		'F11': 122,
		'F12': 123,
		'SHIFT': 16,
		'CTRL': 17,
		'ALT': 18,
		'PLUS': 187,
		'COMMA': 188,
		'MINUS': 189,
		'PERIOD': 190
	};
	return new Input();
});