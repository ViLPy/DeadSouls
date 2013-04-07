/*
 *  Dead souls project
 *
 *  Created by Vitaly Lyapin.
 *  License: CC BY-NC-SA 3.0
 */
define([], function () {
    return {
        degToRad: function (angle) {
            return angle * 0.0174532925;
        },
        radToDeg: function (angle) {
            return angle * 57.2957795;
        },
        distanceSquared: function (p1, p2) {
            return Math.pow((p2.x - p1.x), 2) + Math.pow((p2.y - p1.y), 2);
        },
        distance: function (p1, p2) {
            return Math.sqrt(this.distanceSquared(p1, p2));
        },
        getRandomElement: function (array) {
            return array[Math.floor(Math.random() * array.length)];
        },
        intersectRects: function (r1, r2) {
            return !(Math.min(r2.x1, r2.x2) > Math.max(r1.x1, r1.x2) ||
                Math.max(r2.x1, r2.x2) < Math.min(r1.x1, r1.x2) ||
                Math.min(r2.y1, r2.y2) > Math.max(r1.y1, r1.y2) ||
                Math.max(r2.y1, r2.y2) < Math.min(r1.y1, r1.y2));
        },
        getVector: function (p1, p2) {
            var angle = this.getBearing(p1, p2);
            return {x: Math.cos(angle), y: Math.sin(angle)};
        },
        deviateVector: function (p1, p2, spread) {
            var angle = this.getBearing(p1, p2);
            var da = this.degToRad((Math.random() * spread) - spread / 2);
            return {x: Math.cos(angle + da), y: Math.sin(angle + da)};
        },
        getBearing: function (p1, p2) {
            return Math.atan2(p2.y - p1.y, p2.x - p1.x);
        },
        getBearingDeg: function (p1, p2) {
            var angle = this.getBearing(p1, p2);
            return (this.radToDeg(angle) + 360) % 360;
        },
        findAngle: function (a, c, b) {
            var ab = { x: b.x - a.x, y: b.y - a.y };
            var cb = { x: b.x - c.x, y: b.y - c.y };

            var dot = (ab.x * cb.x + ab.y * cb.y); // dot product
            var cross = (ab.x * cb.y - ab.y * cb.x); // cross product

            return Math.atan2(cross, dot);
        },
        isConvex: function (data) {
            var size = data.length;
            if (size < 4) return true;
            for (var i = 0; i < size; i++) {
                var p1 = (i - 1 + size) % size;
                var p2 = (i + 1 + size) % size;
                var c = (i + size) % size;
                var angle = this.findAngle(data[p1], data[p2], data[c]);
                //console.log(angle + " p1: " + p1 + " p2: " + p2 + " c: " + c);
                if (angle > 0) return false;
            }
            return true;
        },
        isPointInPoly: function (poly, pt) {
            for (var c = false, i = -1, l = poly.length, j = l - 1; ++i < l; j = i)
                ((poly[i].y <= pt.y && pt.y < poly[j].y) || (poly[j].y <= pt.y && pt.y < poly[i].y))
                    && (pt.x < (poly[j].x - poly[i].x) * (pt.y - poly[i].y) / (poly[j].y - poly[i].y) + poly[i].x)
                && (c = !c);
            return c;
        },
        rotateVector: function (xt, yt, angle) {
            var w = this.degToRad(angle);
            var cs = Math.cos(w);
            var sn = Math.sin(w);

            var x = xt * cs - yt * sn;
            var y = xt * sn + yt * cs;

            return {x: x, y: y};
        },
        lerp: function (a, b, x) {
            return a * (1 - x) + b * x;
        },
        cubicInterpolation: function (v0, v1, v2, v3, x) {
            var P = (v3 - v2) - (v0 - v1);
            var Q = (v0 - v1) - P;
            var R = v2 - v0;
            return Math.pow(P * x, 3) + Math.pow(Q * x, 2) + R * x + v1;
        },
        projectileAngle: function (x, y, v) {
            var g = 9.8;
            var v2 = v * v;
            var u = (v2 + Math.sqrt(Math.abs(v2 - g * (g * x * x + 2 * y * v2))));
            var d = g * x;
            return Math.atan(u / d);
        },
        bind: function (func, context) {
            var fn = func; // correlates to this.onTimeout
            return function () { // what gets passed: an anonymous function
                // when invoked, our original function, this.onTimeout,
                // will have the proper context applied
                return fn.apply(context, arguments);
            }
        },
        getCenterPoint: function (plots) {
            var middlePoint = {x: plots[0].x, y: plots[0].y};
            for (var k = 1; k < plots.length; k++) {
                middlePoint.x += plots[k].x;
                middlePoint.y += plots[k].y;
            }
            middlePoint.x /= plots.length;
            middlePoint.y /= plots.length;
            return  middlePoint;
        },
        less: function (a, b, center) {
            if (a.x >= 0 && b.x < 0)
                return true;
            if (a.x == 0 && b.x == 0)
                return a.y > b.y;

            // compute the cross product of vectors (center -> a) x (center -> b)
            var det = (a.x - center.x) * (b.y - center.y) - (b.x - center.x) * (a.y - center.y);
            if (det < 0)
                return true;
            if (det > 0)
                return false;

            // points a and b are on the same line from the center
            // check which point is closer to the center
            var d1 = (a.x - center.x) * (a.x - center.x) + (a.y - center.y) * (a.y - center.y);
            var d2 = (b.x - center.x) * (b.x - center.x) + (b.y - center.y) * (b.y - center.y);
            return d1 > d2;
        }
    };
});