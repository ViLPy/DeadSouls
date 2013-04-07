/*
 *  Dead souls project
 *
 *  Created by Vitaly Lyapin.
 *  License: CC BY-NC-SA 3.0
 */
define(['js/img.loader', 'js/gui.renderer'],
    function (ImgManager, GUIRenderer) {
        var UIFactory = function(renderer, name, data) {
            switch (data.type) {
                case "image":
                    renderer.addImage(name, data.x, data.y, data.atlas, data.src, data.alpha);
                    break;
                case "text":
                    renderer.addText(name, data.x, data.y, data.h, data.text, data.color, data.font);
                    break;
                case "rect":
                    renderer.addFillRect(name, data.x, data.y, data.w, data.h, data.color, data.stroke);
                    break;
            }
            renderer.addMouseEvent(name, data.mouseEventData);
        };

        var UIManager = function () {
            this.uiViews = {};
        };

        UIManager.prototype.init = function (uiData) {
            for (var id in uiData) {
                this.uiViews[id] = new GUIRenderer();
                for (var key in uiData[id]) {
                    UIFactory(this.uiViews[id], key, uiData[id][key]);
                }
            }
        };

        UIManager.prototype.createView = function(name) {
            this.uiViews[name] = new GUIRenderer();
        };

        UIManager.prototype.get = function(name) {
            return this.uiViews[name];
        };

        return new UIManager();
    });