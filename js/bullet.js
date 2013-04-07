/*
 *  Dead souls project
 *
 *  Created by Vitaly Lyapin.
 *  License: CC BY-NC-SA 3.0
 */
define(['underscore', 'js/utils', 'js/config', 'js/animation.mgr', 'js/entity.manager', 'js/physics'], function (_, Util, Config, AnimMgr, EntityManager, Physics) {
    var Bullet = function (id, gunnerID, parentType, mortality, mortalityHead, hitCallback) {
        this.id = id;
        this.callback = hitCallback;
        this.parentType = parentType;
        this.gunnerID = gunnerID;
        this.x = 0;
        this.y = 0;
        this.dx = 1;
        this.dy = 1;
        this.v = 0;
        this.traceAlpha = 0.3;
        this.tracePoints = [];
        this.shouldBeDeleted = false;
        this.hitComplete = false;
        this.mortality = mortality || 1;
        this.mortalityHead = mortalityHead || 1;

        this.isGrenade = false;
        this.isExplodable = false;
    };

    Bullet.prototype.fire = function (x, y, dx, dy, velocity, isExplodable) {
        this.tracePoints = [
            {x:x, y:y}
        ];
        this.x = x;
        this.y = y;
        this.vx = dx * velocity;
        this.vy = dy * velocity;
        this.timer = 0;
        this.isExplodable = isExplodable || false;
    };

    Bullet.prototype.launchGrenade = function (x, y, dx, dy, velocity, timer) {
        this.tracePoints = [
            {x:x, y:y}
        ];
        this.x = x;
        this.y = y;
        this.body = Physics.addBoxObject("gib", x, y, 2, true, false);
        Physics.setVelocityX(this.body, dx * velocity);
        Physics.setVelocityY(this.body, dy * velocity);
        this.timer = timer;
        this.isGrenade = true;
    };

    Bullet.prototype.update = function (dt) {
        this.traceAlpha -= dt * 0.5;
        this.timer -= dt; // grenade timer
        if (this.traceAlpha <= 0 && this.hitComplete) this.shouldBeDeleted = true;
        if (this.hitComplete) return;

        if (this.isGrenade) {
            var pos = Physics.getBodyRealPosition(this.body);
            this.x = pos.x;
            this.y = pos.y;
            if (this.timer < 0) {
                Physics.removeBody(this.body);
                EntityManager.explode(Physics.explode(this.x, this.y, 100, 0.1), this.gunnerID);
                AnimMgr.addExplosion(this.x, this.y);
                this.hitComplete = true;
            }
        } else {
            //check collisions
            var nx = this.x + dt * this.vx;
            var ny = this.y + dt * this.vy;
            this.vy += dt * Config.physScale * 9.8;
            var ignored = [this.parentType, "floor", "gib"];
            //if (!this.isExplodable) ignored.push();
            var castResult = Physics.raycast({x:this.x, y:this.y}, {x:nx, y:ny}, ignored);
            if (castResult) {
                this.hitComplete = this.callback(this, this.gunnerID, castResult.body);//, castResult.point, castResult.normal);
            }
            if (!this.hitComplete) {
                this.x = nx;
                this.y = ny;
            } else {
                this.x = castResult.point.x;
                this.y = castResult.point.y;
                if (this.isExplodable) {
                    EntityManager.explode(Physics.explode(this.x, this.y, 100, 0.1), this.gunnerID);
                    AnimMgr.addExplosion(this.x, this.y);
                }
            }
        }
        this.tracePoints.push({x:this.x, y:this.y});

        if (!this.isGrenade && (this.x < 0 || this.x > Config.worldWidth)) this.hitComplete = true;
    };

    Bullet.prototype.render = function (renderer) {
        if (!this.hitComplete) {
            var radius = 1;
            if (this.isGrenade) radius = 2;
            renderer.drawCircle(this.x, this.y, radius, true, false);
        }
    };

    Bullet.prototype.renderTail = function (renderer) {
        if (!this.shouldBeDeleted && this.traceAlpha > 0.01) {
            renderer.setStrokeType("rgba(255,255,255," + this.traceAlpha + ")");
            renderer.drawPolygon(this.tracePoints, true, false);
        }
    };

    return Bullet;
});
