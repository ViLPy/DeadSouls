/*
 *  Dead souls project
 *
 *  Created by Vitaly Lyapin.
 *  License: CC BY-NC-SA 3.0
 */
define([], function () {
    var Renderer = function (context, w, h) {
        this.context = context;
        this.context.textBaseline = 'top';
        this.w = w;
        this.h = h;
        this.scale = 1;
        this.ox = 0;
        this.oy = 0;
    };

    Renderer.prototype.setTextAlign = function(hor, vert) {
        this.context.textAlign = hor || 'start';
        this.context.textBaseline = vert || 'top';
    }

    Renderer.prototype.setScale = function (scale) {
        this.scale = scale;
    };

    Renderer.prototype.setOriginPosition = function (x, y) {
        this.ox = x;
        this.oy = y;
    };

    Renderer.prototype.translateCoordinates = function (x, y) {
        return {x:x + this.ox, y:y + this.oy};
    };

    Renderer.prototype.translateCoordinatesV = function (v) {
        return {x:v.x - this.ox, y:v.y - this.oy};
    };

    Renderer.prototype.createPatternFromImage = function (img, repeat) {
        return this.context.createPattern(img, repeat);
    };

    Renderer.prototype.clear = function () {
        this.context.clearRect(0, 0, this.w, this.h);
    };

    Renderer.prototype.clearRect = function (x, y, w, h) {
        this.context.clearRect(x, y, w, h);
    };

    Renderer.prototype.drawPoint = function (x, y) {
        this.drawCircle(x, y, 1);
    };

    Renderer.prototype.setFillStyle = function (style) {
        style = style || "#000000";
        this.context.fillStyle = style;
    };

    Renderer.prototype.setStrokeType = function (style) {
        style = style || "#000000";
        this.context.strokeStyle = style;
    };

    Renderer.prototype.setLineWidth = function (width) {
        width = width || 1;
        this.context.lineWidth = width;
    };

    Renderer.prototype.drawCircle = function (x, y, radius, fill, stroke) {
        this.context.beginPath();
        this.context.arc(this.ox + x * this.scale, this.oy + y * this.scale, radius * this.scale, 0, 2 * Math.PI, false);
        this.context.closePath();
        if (stroke || stroke == undefined) this.context.stroke();
        if (fill || fill == undefined) this.context.fill();
    };

    Renderer.prototype.drawSmoothLine = function (data, centerPosition, close, stroke, fill) {
        if (data.length < 4) return;
        this.context.beginPath();
        this.context.moveTo(this.ox + (data[0].x + centerPosition.x) * this.scale, this.oy + (data[0].y + centerPosition.y) * this.scale);
        var i;
        for (i = 1; i < data.length - 2; i++) {
            var cpX = this.ox + (data[i].x + centerPosition.x) * this.scale;
            var cpY = this.oy + (data[i].y + centerPosition.y) * this.scale;

            var npX = this.ox + (data[i + 1].x + centerPosition.x) * this.scale;
            var npY = this.oy + (data[i + 1].y + centerPosition.y) * this.scale;

            var xc = (cpX + npX) / 2;
            var yc = (cpY + npY) / 2;
            this.context.quadraticCurveTo(cpX, cpY, xc, yc);
        }
        var cpX = this.ox + (data[i].x + centerPosition.x) * this.scale;
        var cpY = this.oy + (data[i].y + centerPosition.y) * this.scale;

        var npX = this.ox + (data[i + 1].x + centerPosition.x) * this.scale;
        var npY = this.oy + (data[i + 1].y + centerPosition.y) * this.scale;

        this.context.quadraticCurveTo(cpX, cpY, npX, npY);
        if (close) this.context.closePath();

        if (stroke || stroke == undefined) this.context.stroke();
        if (fill) this.context.fill();
    };

    Renderer.prototype.drawPolygon = function (data, stroke, close, fill) {
        if (data.length < 2) return;
        this.context.beginPath();
        this.context.moveTo(this.ox + data[0].x * this.scale, this.oy + data[0].y * this.scale);
        for (var i = 1; i < data.length; i++) {
            this.context.lineTo(this.ox + data[i].x * this.scale, this.oy + data[i].y * this.scale);
        }
        if (close || close == undefined) this.context.closePath();
        if (stroke) this.context.stroke();
        if (fill) this.context.fill();
    };

    Renderer.prototype.setFont = function (font) {
        this.context.font = font || "10px sans-serif";
    };

    Renderer.prototype.drawText = function (text, x, y) {
        this.context.fillText(text, x, y);
    };

    Renderer.prototype.measureText = function (text) {
        return this.context.measureText(text);
    };

    Renderer.prototype.drawImage = function (imgFrame, posX, posY) {
        if (imgFrame && imgFrame.img) {
            this.context.drawImage(imgFrame.img, imgFrame.spt.x, imgFrame.spt.y, imgFrame.spt.w, imgFrame.spt.h,
                imgFrame.spt.cx + posX + this.ox, imgFrame.spt.cy + posY + this.oy, imgFrame.spt.w, imgFrame.spt.h);
        }
    };

    Renderer.prototype.drawImageT = function (imgFrame, posX, posY, c, scale, rotate) {
        if (imgFrame && imgFrame.img) {
            this.context.save();
            this.context.translate(posX + this.ox, posY + this.oy);
            this.context.rotate(rotate);
            this.context.scale(scale.x, scale.y);
            this.context.drawImage(imgFrame.img, imgFrame.spt.x, imgFrame.spt.y, imgFrame.spt.w, imgFrame.spt.h,
                imgFrame.spt.cx + c.x, imgFrame.spt.cy + c.y, imgFrame.spt.w, imgFrame.spt.h);
            this.context.restore();
        }
    };

    Renderer.prototype.copyCanvas = function (canvas, x, y, w, h) {
        if (x < 0 || y < 0) {
            console.log("Negative index for canvas!");
            return;
        }
        this.context.drawImage(canvas, x, y, w, h, 0, 0, w, h);
    };

    Renderer.prototype.drawLine = function (fromX, fromY, toX, toY) {
        this.context.beginPath();
        this.context.moveTo(this.ox + fromX * this.scale, this.oy + fromY * this.scale);
        this.context.lineTo(this.ox + toX * this.scale, this.oy + toY * this.scale);
        this.context.stroke();
    };

    Renderer.prototype.drawQLine = function (fromX, fromY, toX, toY, cx, cy) {
        this.context.beginPath();
        this.context.moveTo(this.ox + fromX * this.scale, this.oy + fromY * this.scale);
        this.context.quadraticCurveTo(this.ox + cx, this.oy + cy, this.ox + toX * this.scale, this.oy + toY * this.scale);
        this.context.stroke();
    };

    Renderer.prototype.fillRect = function (x, y, w, h) {
        this.context.fillRect(this.ox + x * this.scale, this.oy + y * this.scale, w * this.scale, h * this.scale);
    };

    Renderer.prototype.strokeRect = function (x, y, w, h) {
        this.context.strokeRect(this.ox + x * this.scale, this.oy + y * this.scale, w * this.scale, h * this.scale);
    };

    return Renderer;
});