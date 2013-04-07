/*
 *  Dead souls project
 *
 *  Created by Vitaly Lyapin.
 *  License: CC BY-NC-SA 3.0
 */
define(['js/utils', 'js/bullet', 'js/weapon', 'js/bullet.manager', 'js/entity.manager', 'js/physics', 'js/sound.mgr', 'js/img.loader'],
    function (Util, Bullet, Weapon, BulletManager, EntityManager, Physics, Sound, ImgManager) {
        var Entity = function (id, spriteData, x, y, isEnemy) {
            this.id = id;
            this.isEnemy = isEnemy;
            this.runAnim = spriteData.runAnim;
            this.staySprite = spriteData.staySprite;
            this.crouchSprite = spriteData.crouchSprite;
            this.handsSprite = spriteData.handsSprite;
            this.body = Physics.addPlayer(x, y, id, isEnemy);
            this.touches = 0;
            this.groundTouches = 0;
            this.floorTouches = 0;
            this.stairsTouches = 0;
            this.movingDown = false;
            this.movingUp = false;
            this.move = false;
            this.moveAnim = false;
            this.score = 0;

            this.aimBearing = 0;
            this.aimPoint = undefined;
            this.killed = false;
            this.spawnable = false;

            Physics.addCollisionCallback(id, true, Util.bind(function (userData1, userData2, isEnded) {
                this.touches += (isEnded) ? -1 : 1;
                if (userData1.type == "ground" || userData2.type == "ground") this.groundTouches += (isEnded) ? -1 : 1;
                if (userData1.type == "floor" || userData2.type == "floor") this.floorTouches += (isEnded) ? -1 : 1;
                if (userData2.type == "object") {
                    if (userData2.id.indexOf("powerUp") == 0 && !userData2.additionalInfo.used) {
                        switch (userData2.additionalInfo.type) {
                            case "hp":
                            this.hp = Math.min(100, this.hp + 50);
                            userData2.additionalInfo.used = true;
                            break;
                        }
                    }
                }
            }, this));

            this.position = {x:x, y:y};

            this.hp = 100;

            this.weapons = {};
            this.currentWeapon = undefined;

            this.movementSpeed = 3;
            this.jumpImpulse = 3;
            this.isCrouch = false;
            this.runCounter = 0;
        };

        Entity.prototype.respawn = function (x, y) {
            if (!this.body) {
                this.body = Physics.addPlayer(x, y, this.id, this.isEnemy);
                this.position = {x:x, y:y};
                this.hp = 100;
                this.runCounter = 0;
                this.running = false;
                this.killed = false;
                for (var name in this.weapons) {
                    this.weapons[name].reset();
                }
            }
        };

        Entity.prototype.setRunning = function(flag) {
            if (!flag) {
                this.running = false;
                return;
            }
            if (!this.running && this.runCounter>0) return; // cannot run yet
            this.running = true;
            this.runCounter = 0;
        }

        Entity.prototype.setMovementSpeed = function (speed) {
            this.movementSpeed = speed;
        };

        Entity.prototype.addWeapon = function (weaponSpec) {
            this.weapons[weaponSpec.id] = new Weapon(weaponSpec.id, weaponSpec.fireSpeed, weaponSpec.reloadSpeed,
                weaponSpec.ammoAmount, weaponSpec.isAuto, weaponSpec.spread, weaponSpec.totalAmmo);
            this.weapons[weaponSpec.id].isGrenade = weaponSpec.isGrenade || false;
            this.weapons[weaponSpec.id].isExplodable = weaponSpec.isExplodable || false;
            this.weapons[weaponSpec.id].power = weaponSpec.power || 10;
            this.weapons[weaponSpec.id].mortality = weaponSpec.mortality || 1;
            this.weapons[weaponSpec.id].mortalityHead = weaponSpec.mortalityHead || 1;
            this.weapons[weaponSpec.id].bulletsPerTime = weaponSpec.bulletsPerTime || 1;
            this.weapons[weaponSpec.id].bulletPowerSpread = weaponSpec.bulletPowerSpread || 0;
            if (weaponSpec.sprite) {
                this.weapons[weaponSpec.id].sprite = ImgManager.getImage(weaponSpec.sprite.atlas, weaponSpec.sprite.img);
                this.weapons[weaponSpec.id].spriteScale = weaponSpec.sprite.scale;
                this.weapons[weaponSpec.id].spriteCenter = weaponSpec.sprite.center;
            }
             this.weapons[weaponSpec.id].sound = weaponSpec.sound;
             this.weapons[weaponSpec.id].soundSettings = weaponSpec.soundSettings;
        };

        Entity.prototype.drawWeapon = function (id) {
            this.currentWeapon = this.weapons[id];
        };

        Entity.prototype.setAimAngle = function (angle) {
            this.aimBearing = (angle + 360) % 360;
            this.aimPoint = undefined;
        };

        Entity.prototype.setAimPoint = function (pt) {
            this.aimPoint = pt;
        };

        Entity.prototype.moveLeft = function () {
            if (this.isCrouch) return;

            var speed = this.movementSpeed;
            if (this.running) speed *= 1.7;

            if (this.touches > 0) {
                Physics.setImpulseX(this.body.body, -speed);
                this.move = true;
            }
            this.moveAnim = true;
            this.moveForward = false;
        };

        Entity.prototype.moveRight = function () {
            if (this.isCrouch) return;

            var speed = this.movementSpeed;
            if (this.running) speed *= 1.7;

            if (this.touches > 0) {
                Physics.setImpulseX(this.body.body, speed);
                this.move = true;
            }
            this.moveAnim = true;
            this.moveForward = true;
        };

        Entity.prototype.setMovingUp = function (flag) {
            if (!this.body) return;
            var data = this.body.body.GetUserData();
            var data2 = this.body.head.GetUserData();
            var data3 = this.body.sitting.GetUserData();
            if (!flag) {
                if ((data.movingUp && this.stairsTouches > 0) && this.groundTouches <= 0) {
                    return;
                }
            } else if (flag) {
                if (this.stairsTouches > 0) return;
            }
            data.movingUp = flag || this.movingDown;
            data2.movingUp = flag || this.movingDown;
            data3.movingUp = flag || this.movingDown;
            this.movingUp = flag;
        };

        Entity.prototype.setMovingDown = function (flag) {
            if (!this.body) return;
            var data = this.body.body.GetUserData();
            var data2 = this.body.head.GetUserData();
            var data3 = this.body.sitting.GetUserData();
            if (!flag) {
                if ((data.movingDown && this.floorTouches > 0) && this.groundTouches <= 0) {
                    return;
                }
            }
            data.movingDown = flag;
            data2.movingDown = flag;
            data3.movingDown = flag;
            this.movingDown = flag;
        };

        Entity.prototype.jump = function () {
            if (!this.jumped && this.touches > 0) {
                Physics.setVelocityY(this.body.body, -this.jumpImpulse);
                this.jumped = true;
            }
        };

        Entity.prototype.crouch = function (flag) {
            if (!this.body) return;
            if (flag && this.touches > 0) {
                this.isCrouch = flag;
                this.body.sitting.SetPosition(this.body.body.GetPosition());
                Physics.setVelocity(this.body.sitting, 0, 0);
            } else if (!flag) {
                this.isCrouch = flag;
            }
            this.body.sitting.SetActive(this.isCrouch);
            this.body.body.SetActive(!this.isCrouch);
            this.body.head.SetActive(!this.isCrouch);
        };

        Entity.prototype.getGunPosition = function () {
            var gunPosition;
            var dy = 1;
            if (this.isCrouch) dy = 10;
            if (this.currentWeapon.isGrenade) {
                var gunDeltaPos = Util.rotateVector(10, 0, this.aimBearing);
                gunPosition = {x:this.position.x + gunDeltaPos.x, y:this.position.y + gunDeltaPos.y + dy};
            } else {
                gunPosition = {x:this.position.x, y:this.position.y + dy};
            }
            gunPosition.y -= 10;

            return gunPosition;
        };

        Entity.prototype.shoot = function () {
            if (!this.killed && this.currentWeapon.canShoot()) {
                this.currentWeapon.shoot();
                var gunPosition = this.getGunPosition();
                var factAim = this.aimBearing;
                if (this.aimPoint) factAim = Util.getBearingDeg(gunPosition, this.aimPoint);

                for (var i = 0; i < this.currentWeapon.bulletsPerTime; i++) {
                    var spread = Math.random() * this.currentWeapon.spread - this.currentWeapon.spread * 0.5;
                    var dV = {x:Math.cos(Util.degToRad(factAim + spread)), y:Math.sin(Util.degToRad(factAim + spread))};
                    var bullet = new Bullet("bullet" + BulletManager.nextBulletID, this.id, this.body.body.GetUserData().type,
                        this.currentWeapon.mortality, this.currentWeapon.mortalityHead, Util.bind(this.bulletHit, this));

                    if (this.currentWeapon.isGrenade) {
                        bullet.launchGrenade(gunPosition.x, gunPosition.y, dV.x, dV.y, this.currentWeapon.power, 3);
                    } else {
                        bullet.fire(gunPosition.x, gunPosition.y, dV.x, dV.y, this.currentWeapon.power + Math.random() * this.currentWeapon.bulletPowerSpread, this.currentWeapon.isExplodable);
                    }
                    BulletManager.add(bullet);
                }
                Sound.playSound(this.currentWeapon.sound, this.currentWeapon.soundSettings);
            }
        };

        Entity.prototype.bulletHit = function (bullet, gunnerID, userData) {
            if (userData && !(gunnerID == this.id && userData.id == this.id)) {
                var targetID = userData.id;
                var isHead = userData.isHead;
                EntityManager.hit(targetID, (isHead) ? bullet.mortalityHead : bullet.mortality, isHead, {x:bullet.vx, y:bullet.vy}, this);
                BulletManager.hitComplete(bullet.id);
                return true;
            }
            return false;
        };

        Entity.prototype.isFacedRight = function () {
            return !(this.aimBearing > 90 && this.aimBearing < 270);
        };

        Entity.prototype.getVelocity = function () {
            return this.body.body.GetLinearVelocity();
        };

        Entity.prototype.update = function (delta) {
            if (this.running && this.runCounter < 2) {
                this.runCounter += delta;
            } else if (this.running && this.runCounter >= 2) {
                 this.running = false;
            } else if (!this.running) {
                this.runCounter -= delta;
            }
            if (this.currentWeapon) this.currentWeapon.update(delta);
            if (this.hp <= 0) return;

            var movingUp = !this.move && ((this.groundTouches == 0) && this.movingUp) && (this.touches > 0);
            var movingDown = ((this.groundTouches == 0) && this.movingDown);
            var shouldBeStopped = ((!this.move && this.touches > 0) || this.isCrouch) || movingUp;
            var shouldNotBeStopped = ((this.groundTouches == 0) && !this.movingUp && !this.movingDown) && !(this.floorTouches > 0);

            if ((shouldBeStopped && !movingDown) && !shouldNotBeStopped && !this.jumped) {
                Physics.setFriction(this.body.body, 50);
                Physics.setImpulseX(this.body.body, 0);
                Physics.setImpulseY(this.body.body, 0);
            } else {
                Physics.setFriction(this.body.body, 0.1);
            }

            this.position = Physics.getBodyRealPosition(this.body.body);
            if (this.aimBearing > 90 && this.aimBearing < 270) this.moveForward = !this.moveForward;
            if (this.moveForward) {
                this.runAnim.update(delta);
            } else {
                this.runAnim.update(-delta);
            }
        };

        Entity.prototype.render = function (renderer) {
            // TODO: caching!
            if (this.hp <= 0) return;

            var scale = {x:1, y:1};
            var angle = Util.degToRad(this.aimBearing);
            if (this.aimBearing > 90 && this.aimBearing < 270) {
                scale.x = -1;
                this.moveForward = !this.moveForward;
                angle = Util.degToRad(this.aimBearing + 180);
            }

            var dy = 0;
            if (this.moveAnim) {
                renderer.drawImageT(this.runAnim.getFrame(), this.position.x, this.position.y - 7, {x:0, y:0}, scale, 0);
            } else if (this.isCrouch) {
                renderer.drawImageT(this.crouchSprite, this.position.x, this.position.y - 7, {x:0, y:0}, scale, 0);
                dy = 9;
            } else {
                renderer.drawImageT(this.staySprite, this.position.x, this.position.y - 7, {x:0, y:0}, scale, 0);
            }
            //renderer.drawImageT(this.headSprite, this.position.x, this.position.y - 16, {x:0, y:0}, scale, 0);
            renderer.drawImageT(this.handsSprite, this.position.x, this.position.y - 10 + dy, {x:4, y:2}, scale, angle);
            if (this.currentWeapon && this.currentWeapon.sprite) {
                renderer.drawImageT(this.currentWeapon.sprite, this.position.x, this.position.y - 10 + dy, {x:4 + this.currentWeapon.spriteCenter.x, y:2 + this.currentWeapon.spriteCenter.y}, scale, angle);
            }

            this.move = false;
            this.moveAnim = false;
            if (this.movingUp || this.movingDown || (this.floorTouches == 0 && this.stairsTouches == 0)) this.jumped = false;
        };

        Entity.prototype.kill = function () {
            this.killed = true;
            Physics.removeBody(this.body.body);
            Physics.removeBody(this.body.head);
            Physics.removeBody(this.body.sitting);
            this.body = null;
        };

        return Entity;
});
