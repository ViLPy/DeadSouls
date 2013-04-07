/*
 *  Dead souls project
 *
 *  Created by Vitaly Lyapin.
 *  License: CC BY-NC-SA 3.0
 */
define(['underscore', 'js/utils','js/img.loader', 'js/sound.mgr'], function (_, Util, ImgManager, Sound) {
        var GuiRenderer = function () {
            this.elements = {};
            this.elementOrder = [];
        };

        GuiRenderer.prototype.addImage = function (name, x, y, atlas, src, a) {
            if (a == undefined) a = 1;
            var img = ImgManager.getImage(atlas, src);
            this.elements[name] = {
                type:"image",
                src:src,
                atlas:atlas,
                x:x,
                y:y,
                w:img.spt.w,
                h:img.spt.h,
                alpha:a
            };
            this.elementOrder.push({name:name, z:1});
        };

        GuiRenderer.prototype.addText = function (name, x, y, h, text, color, font) {
            this.elements[name] = {
                type:"text",
                text:text,
                color:color || "#000000",
                font:font || "10px sans-serif",
                x:x + 2,
                y:y + 2,
                w:0,
                h:h
            };
            this.elementOrder.push({name:name, z:1});
        };

        GuiRenderer.prototype.addFillRect = function (name, x, y, w, h, color, stroke) {
            this.elements[name] = {
                type:"fillRect",
                color:color,
                x:x,
                y:y,
                w:w,
                h:h,
                stroke: stroke
            };
            this.elementOrder.push({name:name, z:1});
        };

        GuiRenderer.prototype.addMouseEvent = function(name, eventData) {
            if (!this.elements[name]) return;
            this.elements[name].mouseEvent = eventData;
        };

        GuiRenderer.prototype.setZOrder = function (name, z) {
            for (var i = 0; i < this.elementOrder.length; i++) {
                if (this.elementOrder[i].name == name) {
                    this.elementOrder[i].z = z;
                    break;
                }
            }
            this.elementOrder[i].sort(function (a, b) {
                return b - a
            });
        };

        GuiRenderer.prototype.update = function (name, values) {
            if (!this.elements[name]) return;
            for (var key in values) {
                this.elements[name][key] = values[key];
            }
        };

        GuiRenderer.prototype.render = function (renderer, mousePosition) {
            mousePosition = mousePosition || {x: 0, y:0};
            for (var i = 0; i < this.elementOrder.length; i++) {
                renderer.setFillStyle();
                var name = this.elementOrder[i].name;
                var data = this.elements[name];
                if (this.elements[name].mouseEvent && this.pointOnElement(name, mousePosition, renderer)) {
                    data = _.clone(data);
                    _.extend(data, this.elements[name].mouseEvent);
                    if (!this.elements[name].soundPlayed) {
                        Sound.playSound("menu");
                        this.elements[name].soundPlayed = true;
                    }
                } else {
                    this.elements[name].soundPlayed = false;
                }
                switch (this.elements[name].type) {
                    case "image":
                        renderer.context.globalAlpha = data.alpha;
                        renderer.drawImage(ImgManager.getImage(data.atlas, data.src), data.x+data.w/2, data.y+data.h/2);
                        renderer.context.globalAlpha = 1;
                        break;
                    case "text":
                        renderer.setFont(data.font);
                        renderer.setFillStyle(data.color);
                        renderer.drawText(data.text, data.x, data.y);
                        var measure = renderer.measureText(data.text);
                        this.elements[name].w = measure.width + 4;
                        break;
                    case "fillRect":
                        renderer.setFillStyle(data.color);
                        renderer.fillRect(data.x, data.y, data.w, data.h);
                        if (data.stroke) {
                            renderer.setStrokeType(data.stroke);
                            renderer.strokeRect(data.x, data.y, data.w, data.h);
                        }
                        break;
                }
            }
        };

        GuiRenderer.prototype.pointOnElement = function (name, point, renderer) {
            var x = point.x;
            var y = point.y;
            if (this.elements[name]) {
                var el = this.elements[name];
                var w = el.w || 0;
                return !(el.x > x || el.x + w < x || el.y > y || el.y + el.h < y);
            }
            return false;
        };

        return GuiRenderer;
    }
)
;
