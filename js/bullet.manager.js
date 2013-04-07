/*
 *  Dead souls project
 *
 *  Created by Vitaly Lyapin.
 *  License: CC BY-NC-SA 3.0
 */
define([], function () {
    var BulletManager = function () {
        this.reset();
    };

    BulletManager.prototype.reset = function () {
        this.bullets = {};
        this.nextBulletID = 0;
    };

    BulletManager.prototype.add = function (bullet) {
        this.bullets[bullet.id] = bullet;
        this.nextBulletID++;
    };

    BulletManager.prototype.updateAndRender = function (delta, renderer) {
        renderer.setFillStyle();
        for (var bullet in this.bullets) {
            if (this.bullets[bullet].shouldBeDeleted) {
                delete this.bullets[bullet];
            } else {
                this.bullets[bullet].update(delta);
                this.bullets[bullet].render(renderer);
                this.bullets[bullet].renderTail(renderer);
            }
        }
    };

    BulletManager.prototype.hitComplete = function (id) {
        this.bullets[id].hitComplete = true;
    };

    return new BulletManager();
});
