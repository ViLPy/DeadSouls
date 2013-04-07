/*
 *  Dead souls project
 *
 *  Created by Vitaly Lyapin.
 *  License: CC BY-NC-SA 3.0
 */
define([
    'js/microajax',
    'js/utils'
], function (Ajax, Utils) {
    var Atlas = function (imgurl, jsonurl) {
        this.img = new Image();
        this.sprites = {};
        this.imgSource = imgurl;
        this.jsonSource = jsonurl;
    };
    Atlas.prototype.load = function (callback) {
        this.callback = callback;
        this.img.onload = Utils.bind(this.loaded, this);

        new Ajax(this.jsonSource, Utils.bind(function (data) {
            this.map = JSON.parse(data).frames;
            this.img.src = this.imgSource;
        }, this));
    };
    Atlas.prototype.loaded = function () {
        for (var i = 0; i < this.map.length; i++) {
            var frame = this.map[i];
            this.sprites[frame.filename] = frame.frame;
            this.sprites[frame.filename].w = frame.frame.w;
            this.sprites[frame.filename].h = frame.frame.h;
            this.sprites[frame.filename].cx = -frame.frame.w * 0.5;
            this.sprites[frame.filename].cy = -frame.frame.h * 0.5;
        }
        this.callback();
    };

    var ImgLoader = function () {
        this.resources = {};
        this.loaded = 0;
        this.toLoad = 0;
    };
    ImgLoader.prototype.addResource = function (name, imgurl, jsonurl) {
        this.resources[name] = new Atlas(imgurl, jsonurl);
        this.toLoad++;
    };
    ImgLoader.prototype.resourceLoaded = function () {
        this.loaded++;
        if (this.loaded == this.toLoad) {
            this.callback();
        }
    };
    ImgLoader.prototype.startLoading = function (callback) {
        this.callback = callback;
        for (var key in this.resources) {
            this.resources[key].load(Utils.bind(this.resourceLoaded, this));
        }
    };
    ImgLoader.prototype.findAtlas = function (fileName) {
        for (var atlasName in this.resources) {
            if (this.resources[atlasName].sprites[fileName]) {
                return atlasName;
            }
        }
        return null;
    };
    ImgLoader.prototype.getImage = function (atlasName, fileName) {
        if (this.resources[atlasName] && this.resources[atlasName].sprites[fileName]) {
            return {
                "img":this.resources[atlasName].img,
                "spt":this.resources[atlasName].sprites[fileName]
            };
        }
        return null;
    };
    ImgLoader.prototype.getFiles = function () {
        var files = [];
        for (var atlasName in this.resources) {
            for (var fname in this.resources[atlasName].sprites) {
                files.push(fname);
            }
        }
        return files;
    };

    return new ImgLoader();
});