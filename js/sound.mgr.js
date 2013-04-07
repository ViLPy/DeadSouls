/*
 *  Dead souls project
 *  
 *  Based on sources from https://code.google.com/p/gritsgame/
 *  Created by Vitaly Lyapin.
 *  License: CC BY-NC-SA 3.0
 */
define([], function () {
    var SoundMgr = function () {
        try {
            this.context = new webkitAudioContext();
            this.mainNode = this.context.createGainNode(0);
            this.mainNode.connect(this.context.destination);
            this.supported = true;
        }
        catch (e) {
            this.supported = false;
        }

        this.sounds = {};
        this.soundsToLoad = {};
        this.loaded = 0;
        this.toLoad = 0;
        this.isMuted = false;
        this.callback = function () {
        };
    };

    SoundMgr.prototype.addSound = function (name, url) {
        if (this.sounds[name] || !this.supported) return
        this.sounds[name] = {url:url, buffer:null};
        this.toLoad++;
    };

    SoundMgr.prototype.startLoading = function (callback) {
        this.callback = callback;
        if (!this.supported) {
            callback();
            return;
        }
        for (var name in this.sounds) {
            this.doLoad(this.sounds[name]);
        }
    };

    SoundMgr.prototype.doLoad = function (sound) {
        var request = new XMLHttpRequest();
        request.open('GET', sound.url, true);
        request.responseType = 'arraybuffer';
        var that = this;
        request.onload = function () {
            that.context.decodeAudioData(request.response,
                function (buffer) {
                    sound.buffer = buffer;
                    that.loaded++;
                    if (that.toLoad == that.loaded) that.callback();
                },
                function (data) {
                    console.log("Failed to load " + sound.url);
                    that.loaded++;
                    if (that.toLoad == that.loaded) that.callback();
                });

        };
        request.send();
    };

    SoundMgr.prototype.togglemute = function () {
        this.isMuted = !this.isMuted;
        if (this.supported) {
            if (this.isMuted) this.mainNode.gain.value = 0;
            else this.mainNode.gain.value = 1;
        }
    };

    SoundMgr.prototype.updateVolume = function (vol) {
        if (this.supported) {
            this.mainNode.gain.value = vol;
        }
    };

    SoundMgr.prototype.stopAll = function () {
        if (this.supported) {
            this.mainNode.disconnect();
            this.mainNode = this.context.createGainNode(0);
            this.mainNode.connect(this.context.destination);
        }
    };

    SoundMgr.prototype.playSound = function (name, settings) {
        var looping = false;
        var volume = 1;
        if (settings) {
            if (settings.looping)
                looping = settings.looping;
            if (settings.volume)
                volume = settings.volume;
        }

        if (this.supported) {
            var sd = this.sounds[name];
            if (!sd) return;

            var currentClip = this.context.createBufferSource(); // creates a sound source
            currentClip.buffer = sd.buffer;                    // tell the source which sound to play
            currentClip.gain.value = volume;
            currentClip.connect(this.mainNode);
            currentClip.loop = looping;
            currentClip.noteOn(0);                          // play the source now
        }
    };

    return new SoundMgr();
});