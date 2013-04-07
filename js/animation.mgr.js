/*
 *  Dead souls project
 *
 *  Created by Vitaly Lyapin.
 *  License: CC BY-NC-SA 3.0
 */
define(['js/utils', 'js/img.loader', 'js/anim'], function (Util, ImgManager, Animation) {
    var AnimMgr = function () {
        this.reset();
    };

    AnimMgr.prototype.reset = function () {
        this.anims = {};
        this.nextID = 0;
    };

    AnimMgr.prototype.add = function (anim, x, y) {
        this.anims[this.nextID++] = {
            anim:anim,
            x:x,
            y:y,
            angle:0
        };
    };

    AnimMgr.prototype.addExplosion = function (x, y) {
        this.anims[this.nextID++] = {
            anim:new Animation("player", "Boom_", ".png", 0, 15, 35, false),
            x:x,
            y:y,
            angle:Util.degToRad(Math.random() * 360)
        };
    };

    AnimMgr.prototype.update = function (delta) {
        for (var name in this.anims) {
            var finished = !this.anims[name].anim.update(delta);
            if (finished) {
                delete this.anims[name];
            }
        }
    };

    AnimMgr.prototype.render = function (renderer) {
        for (var name in this.anims) {
            renderer.drawImageT(this.anims[name].anim.getFrame(), this.anims[name].x, this.anims[name].y, {x:0, y:0}, {x:1, y:1}, this.anims[name].angle);
        }
    };
    return new AnimMgr();
});