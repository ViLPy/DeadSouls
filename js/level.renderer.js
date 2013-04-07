/*
 *  Dead souls project
 *
 *  Created by Vitaly Lyapin.
 *  License: CC BY-NC-SA 3.0
 */
define(['jquery', 'js/utils', 'js/img.loader', 'js/gfx', 'js/config'], function ($, Util, ImgLoader, Renderer, Config) {
    var LevelRenderer = function (mapData) {
        this.staticObjects = mapData.static;
        this.zones = mapData.zones;
        this.hasForeground = false;
        for (var i = 0; i < this.staticObjects.length; i++) {
            if (this.staticObjects[i].zindex <= 0) this.hasForeground = Config.useGfxFG;
        }

        Config.worldWidth = mapData.w || 2048;
        Config.worldHeight = mapData.h || 2048;

        var bg = $('<canvas>');
        bg.hide();
        bg.attr('width', mapData.w || 2048);
        bg.attr('height', mapData.h || 2048);
        $('body').append(bg);

        if (this.hasForeground) {
            var fg = $('<canvas>');
            fg.hide();
            fg.attr('width', mapData.w || 2048);
            fg.attr('height', mapData.h || 2048);
            $('body').append(fg);
            this.fgCanvas = fg[0];
            this.fgRenderer = new Renderer(fg[0].getContext('2d'), mapData.w || 2048, mapData.h || 2048);
        }

        this.canvas = bg[0];
        this.renderer = new Renderer(bg[0].getContext('2d'), mapData.w || 2048, mapData.h || 2048);
        this.renderer.setFillStyle("#a0a0a0");
        this.renderer.fillRect(0, 0, mapData.w || 2048, mapData.h || 2048);
        this.renderer.setFillStyle();
        this.initalRender();
    };

    LevelRenderer.prototype.translatePlots = function (plots, scaleX, scaleY, angle) {
        if (!plots || plots.length == 0) return plots;
        scaleX = scaleX || 1;
        scaleY = scaleY || 1;
        angle = angle || 0;
        var middlePoint = {x:plots[0].x, y:plots[0].y};
        for (var k = 1; k < plots.length; k++) {
            middlePoint.x += plots[k].x;
            middlePoint.y += plots[k].y;
        }
        middlePoint.x /= plots.length;
        middlePoint.y /= plots.length;

        var scaled = [];
        for (var i = 0; i < plots.length; i++) {
            var vec = {x:(plots[i].x - middlePoint.x) * scaleX, y:(plots[i].y - middlePoint.y) * scaleY};
            vec = Util.rotateVector(vec.x, vec.y, angle);
            scaled.push({x:vec.x + middlePoint.x, y:vec.y + middlePoint.y});
        }
        return scaled;
    };

    LevelRenderer.prototype.initalRender = function () {
        this.staticObjects.sort(function (a, b) {
            return b.zindex - a.zindex
        });

        var renderer = this.renderer;

        for (var i = 0; i<~~(Config.worldWidth/512)+1; i++) {
            for (var j = 0; j<~~(Config.worldHeight/512)+1; j++) {
                this.renderer.drawImage(ImgLoader.getImage("decals", "back.png"), i*512, j*512);
            }
        }

        for (var i = 0; i < this.staticObjects.length; i++) {
            var zindex = this.staticObjects[i].zindex;
            var color = 200 / 8 * zindex;
            if (zindex <= 0 && this.hasForeground) {
                color = 0;
                renderer = this.fgRenderer;
            } else {
                renderer = this.renderer;
            }
            renderer.setFillStyle("rgb(" + color + "," + color + "," + color + ")");
            renderer.setStrokeType("rgb(" + color + "," + color + "," + color + ")");

            var plots = this.translatePlots(this.staticObjects[i].plots, this.staticObjects[i].scaleX,
                this.staticObjects[i].scaleY, this.staticObjects[i].angle);
            renderer.context.shadowBlur = 0;
            renderer.setLineWidth(1);
            switch (this.staticObjects[i].type) {
                case "polygon":
                case "dpolygon":
                case "stpolygon":
                case "fpolygon":
                case "cpolygon":
                    if (this.staticObjects[i].zindex <= 0) {
                        renderer.context.shadowBlur = 1;
                        renderer.context.shadowColor = "rgb(" + color + "," + color + "," + color + ")";
                    }
                    renderer.drawPolygon(plots, true, true, true);
                    break;
                case "spolygon":
                    if (this.staticObjects[i].zindex <= 0) {
                        renderer.context.shadowBlur = 1;
                        renderer.context.shadowColor = "rgb(" + color + "," + color + "," + color + ")";
                    }
                    renderer.context.shadowColor = '#000000';
                    renderer.drawSmoothLine(plots, {x:0, y:0}, true, true, true);
                    break;
                case "line":
                    if (plots.length == 2) {
                        var x1 = plots[0].x;
                        var y1 = plots[0].y;
                        var x2 = plots[1].x;
                        var y2 = plots[1].y;
                        renderer.setLineWidth(this.staticObjects[i].width);
                        renderer.drawLine(x1, y1, x2, y2);
                    }
                    break;
                case "qline":
                    if (plots.length == 3) {
                        var x1 = plots[0].x;
                        var y1 = plots[0].y;
                        var x2 = plots[1].x;
                        var y2 = plots[1].y;
                        var cx = plots[2].x;
                        var cy = plots[2].y;
                        renderer.setLineWidth(this.staticObjects[i].width);
                        renderer.drawQLine(x1, y1, x2, y2, cx, cy);
                    }
                    break;
                case "rect":
                    if (plots.length == 2) {
                        var x = plots[0].x;
                        var y = plots[0].y;
                        var w = plots[1].x-plots[0].x;
                        var h = plots[1].y-plots[0].y;
                        renderer.fillRect(x,y,w,h);
                    }
                    break;
                case "image":
                    if (plots.length == 1) {
                        var atlas = ImgLoader.findAtlas(this.staticObjects[i].src);
                        renderer.drawImageT(ImgLoader.getImage(atlas, this.staticObjects[i].src), plots[0].x, plots[0].y,
                            {x:0, y:0}, {x:this.staticObjects[i].scaleX, y:this.staticObjects[i].scaleY},
                            Util.degToRad(this.staticObjects[i].angle));
                    }
                    break;
            }
        }
    };

    LevelRenderer.prototype.render = function (renderer) {
        renderer.copyCanvas(this.canvas, -renderer.ox, -renderer.oy, renderer.w, renderer.h);
    };

    LevelRenderer.prototype.renderFG = function (renderer) {
        if (this.hasForeground) renderer.copyCanvas(this.fgCanvas, -renderer.ox, -renderer.oy, renderer.w, renderer.h);
    };

    LevelRenderer.prototype.plotsInRect = function (plots, fromX, fromY, toX, toY) {
        var flag = (plots.length > 0);
        for (var i = 0; i < plots.length; i++) {
            flag = (Math.min(fromX, toX) > plots[i].x) || (Math.max(fromX, toX) < plots[i].x) || (Math.min(fromY, toY) > plots[i].y) || (Math.max(fromY, toY) < plots[i].y);
            if (!flag) break;
        }
        return flag;
    };
    return LevelRenderer;
});

/*

 primitives types:
 - polygon
 - rect
 - rounded rect
 - line
 - quadratic curve

 {
 rect: {w: 1024, h:1024},
 static: [
 {
 type: "polygon",
 plots: [{x: 0, y:0}, {x: 2, y:0}, {x: 0, y:2}],
 color: "rgb(0,0,0)" || pattern: "diamond.jpg"
 }, ..],
 zones: [
 {
 fromX, fromY, toX, toY,
 coverable: true,
 coverDistance: 15,
 coverPattern: "",
 coverPlots: [{x,y},..],
 coverColor: "black"
 }, ..]
 }


 */