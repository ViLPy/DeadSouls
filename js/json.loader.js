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
    var JSONData = function (jsonurl) {
        this.data = {};
        this.jsonSource = jsonurl;
    };
    JSONData.prototype.load = function (callback) {
        this.callback = callback;

        new Ajax(this.jsonSource, Utils.bind(function (data) {
            this.data = JSON.parse(data);
            this.callback();
        }, this));
    };

    var Loader = function () {
        this.resources = {};
        this.loaded = 0;
        this.toLoad = 0;
    };
    Loader.prototype.addResource = function (name, jsonurl) {
        this.resources[name] = new JSONData(jsonurl);
        this.toLoad++;
    };
    Loader.prototype.resourceLoaded = function () {
        this.loaded++;
        if (this.loaded == this.toLoad) {
            this.callback();
        }
    };
    Loader.prototype.startLoading = function (callback) {
        this.callback = callback;
        for (var key in this.resources) {
            this.resources[key].load(Utils.bind(this.resourceLoaded, this));
        }
    };

    Loader.prototype.getData = function (name) {
        if (this.resources[name]) {
            return this.resources[name].data;
        }
        return null;
    };

    return new Loader;
});