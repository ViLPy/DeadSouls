/*
 *  Dead souls project
 *
 *  Created by Vitaly Lyapin.
 *  License: CC BY-NC-SA 3.0
 */
define(['js/utils', 'js/ragdoll.render', 'js/img.loader', 'js/physics', 'js/ai', 'js/config', 'js/json.loader', 'js/anim', 'js/sound.mgr'], 
    function (Util, RagDollRender, ImgManager, Physics, AI, Config, JSONLoader, Animation, Sound) {
    var EntityManager = function () {
        this.reset();
    };

    EntityManager.prototype.resetWaypoints = function (waypointData) {
        this.decisionMaker = new AI(waypointData || {});
    };

    EntityManager.prototype.reset = function () {
        this.entities = {};
        this.nextRagDollID = 0;
        this.ragdolls = {};
        this.powerUps = {};
        this.decisionMaker = null;
        this.enemySpawnPoints = {};
        this.friendSpawnPoints = {};
        this.entitiesToSpawn = {};
        this.score = {enemy: 0, friend: 0};
        this.flagScore = {enemy: 0, friend: 0};
        this.nextPowerUpID = 0;
        this.flags = {
            enemy: {
                hasFlag: false, // do we have flag on map?
                attachedTo: undefined,
                position: undefined,
                atSpawn: false, // is entity at spawn?
                body: null
            },
            friend: {
                hasFlag: false, // do we have flag on map?
                attachedTo: undefined,
                position: undefined,
                atSpawn: false, // is entity at spawn?
                body: null
            }
        };
    };

    EntityManager.prototype.resetSpawnPoints = function (enemySpawns, friendSpawns) {
        this.enemySpawnPoints = enemySpawns;
        this.friendSpawnPoints = friendSpawns;
    };

    EntityManager.prototype.distanceToTarget = function(name) {
        if (!this.entities[name]) return undefined;
        return this.decisionMaker.getSquaredEntityDistanceToTarget(name);
    };

    EntityManager.prototype.add = function (entity) {
        this.entities[entity.id] = entity;
        var entityType = (entity.isEnemy) ? "enemy" : "friend";
        var weapon = "";
        if (entity.currentWeapon) weapon = entity.currentWeapon.name;
        this.decisionMaker.addEntity(entity.id, entityType, entity.position, weapon);
    };

    EntityManager.prototype.addHPUp = function () {
        var id = "powerUp" + this.nextPowerUpID++;
        var position = this.decisionMaker.getRandomKeyPoint().position;
        var body = Physics.addBoxObject(id, position.x, position.y, 4, false, false, {type: "hp", used: false});
        this.powerUps[id] = {id: id, type: "hp", body: body};
    };

    EntityManager.prototype.spawnFlags = function () {
        this.spawnEnemyFlag(this.decisionMaker.waypoints[this.decisionMaker.enemyFlagPoint].position);
        this.spawnFriendFlag(this.decisionMaker.waypoints[this.decisionMaker.friendFlagPoint].position);
    };

    EntityManager.prototype.forceFriendAttack = function () {
        this.decisionMaker.forceFriendAttack();
    };

    EntityManager.prototype.spawnEnemyFlag = function (pos) {
        this.flags.enemy.hasFlag = true;
        this.flags.enemy.position = pos;
        this.flags.enemy.attachedTo = undefined;
        this.flags.enemy.atSpawn = true;
    };

    EntityManager.prototype.spawnFriendFlag = function (pos) {
        this.flags.friend.hasFlag = true;
        this.flags.friend.position = pos;
        this.flags.friend.attachedTo = undefined;
        this.flags.friend.atSpawn = true;
    };

    EntityManager.prototype.addRagDoll = function (entity, facedRight) {
        var renderer = new RagDollRender(entity, {
            head: {
                img: ImgManager.getImage("player", "head.png"),
                center: {x: 0, y: 2},
                scale: {x: 1, y: 1}
            },
            body: {
                img: ImgManager.getImage("player", "body.png"),
                scale: {x: 1.2, y: 0.7}
            },
            pLegL: {
                img: ImgManager.getImage("player", "pleg.png"),
                center: {x: 0, y: 8},
                scale: {x: 0.7, y: 0.6}
            },
            pLegR: {
                img: ImgManager.getImage("player", "pleg.png"),
                center: {x: 0, y: 8},
                scale: {x: 0.7, y: 0.6}
            },
            legL: {
                img: ImgManager.getImage("player", "leg.png"),
                center: {x: 0, y: 5},
                scale: {x: 0.6, y: 1}
            },
            legR: {
                img: ImgManager.getImage("player", "leg.png"),
                center: {x: 0, y: 5},
                scale: {x: 0.6, y: 1}
            },
            pHandL: {
                img: ImgManager.getImage("player", "hand.png"),
                center: {x: 0, y: 5},
                scale: {x: 0.6, y: 0.8}
            },
            pHandR: {
                img: ImgManager.getImage("player", "hand.png"),
                center: {x: 0, y: 5},
                scale: {x: 0.6, y: 0.8}
            },
            handL: {
                img: ImgManager.getImage("player", "hand.png"),
                center: {x: 0, y: 5},
                scale: {x: 0.6, y: 0.8}
            },
            handR: {
                img: ImgManager.getImage("player", "hand.png"),
                center: {x: 0, y: 5},
                scale: {x: 0.6, y: 0.8}
            }
        }, facedRight);
        this.ragdolls[this.nextRagDollID] = renderer;
        this.nextRagDollID++;
    };

    EntityManager.prototype.checkFlags = function () {
        this.decisionMaker.updateFlags(this.flags);
        var flagDistanceSquared;
        if (this.flags.friend.hasFlag) {
            if (this.flags.friend.attachedTo) {
                flagDistanceSquared = Util.distanceSquared(this.entities[this.flags.friend.attachedTo].position, this.flags.enemy.position);
                if (flagDistanceSquared < 400 && !this.flags.enemy.attachedTo) {
                    this.flagScore.enemy++;
                    this.entities[this.flags.friend.attachedTo].score += 15;
                    this.spawnFriendFlag(this.decisionMaker.waypoints[this.decisionMaker.friendFlagPoint].position);
                }
            } else if (this.flags.friend.body) {
                this.flags.friend.position = Physics.getBodyRealPosition(this.flags.friend.body);
            }
        }
        if (this.flags.enemy.hasFlag) {
            if (this.flags.enemy.attachedTo) {
                flagDistanceSquared = Util.distanceSquared(this.entities[this.flags.enemy.attachedTo].position, this.flags.friend.position);
                if (flagDistanceSquared < 400 && !this.flags.friend.attachedTo) {
                    this.flagScore.friend++;
                    this.entities[this.flags.enemy.attachedTo].score += 15;
                    this.spawnEnemyFlag(this.decisionMaker.waypoints[this.decisionMaker.enemyFlagPoint].position);
                }
            } else if (this.flags.enemy.body){
                this.flags.enemy.position = Physics.getBodyRealPosition(this.flags.enemy.body);
            }
        }
    };

    EntityManager.prototype.update = function (delta) {
        var name, flagDistanceSquared;
        this.checkFlags();

        for (name in this.entities) {
            if (this.entities[name].killed) continue;
            this.decisionMaker.setObjectPosition(name, this.entities[name].position);
            if (this.entities[name].isEnemy) {
                if (this.flags.friend.hasFlag) {
                    if (!this.flags.friend.attachedTo) {
                        flagDistanceSquared = Util.distanceSquared(this.entities[name].position, this.flags.friend.position);
                        if (flagDistanceSquared < 400) {
                            if (this.flags.friend.body) {
                                Physics.removeBody(this.flags.friend.body);
                                this.flags.friend.body = null;
                            }
                            this.flags.friend.attachedTo = name;
                            this.flags.friend.atSpawn = false;
                            this.decisionMaker.setAsFlagHolder(name);
                        }
                    }
                }
                if (this.flags.enemy.hasFlag && !this.flags.enemy.atSpawn && !this.flags.friend.attachedTo) {
                    flagDistanceSquared = Util.distanceSquared(this.entities[name].position, this.flags.enemy.position);
                    if (flagDistanceSquared < 400) {
                        if (this.flags.enemy.body) {
                            Physics.removeBody(this.flags.enemy.body);
                            this.flags.enemy.body = null;
                        }
                        this.spawnEnemyFlag(this.decisionMaker.waypoints[this.decisionMaker.enemyFlagPoint].position);
                    }
                }
            } else { // friends
                if (this.flags.enemy.hasFlag) {
                    if (!this.flags.enemy.attachedTo) {
                        flagDistanceSquared = Util.distanceSquared(this.entities[name].position, this.flags.enemy.position);
                        if (flagDistanceSquared < 400) {
                            if (this.flags.enemy.body) {
                                Physics.removeBody(this.flags.enemy.body);
                                this.flags.enemy.body = null;
                            }
                            this.flags.enemy.attachedTo = name;
                            this.flags.enemy.atSpawn = false;
                            this.decisionMaker.setAsFlagHolder(name);
                        }
                    }
                }
                if (this.flags.friend.hasFlag && !this.flags.friend.atSpawn && !this.flags.friend.attachedTo) {
                    flagDistanceSquared = Util.distanceSquared(this.entities[name].position, this.flags.friend.position);
                    if (flagDistanceSquared < 400) {
                        if (this.flags.friend.body) {
                            Physics.removeBody(this.flags.friend.body);
                            this.flags.friend.body = null;
                        }
                        this.spawnFriendFlag(this.decisionMaker.waypoints[this.decisionMaker.friendFlagPoint].position);
                    }
                }
            }

            if (name != "player") {
                var decision = this.decisionMaker.getDirection(name);
                if (decision.indexOf("left") == 0) {
                    this.entities[name].moveLeft();
                    if (!this.entities[name].currentWeapon || this.entities[name].currentWeapon.canShoot()) this.entities[name].setAimAngle(180);
                }
                else if (decision.indexOf("right") == 0) {
                    this.entities[name].moveRight();
                    if (!this.entities[name].currentWeapon || this.entities[name].currentWeapon.canShoot()) this.entities[name].setAimAngle(0);
                }
                this.entities[name].setMovingUp(decision.indexOf("-up") > 0);
                this.entities[name].setMovingDown(decision.indexOf("-down") > 0);
                if (decision.indexOf("-run") > 0) this.entities[name].setRunning(true);
            } else {
                this.decisionMaker.entities[name].closest = this.decisionMaker.updateClosestWaypoint(this.entities[name].position);
            }
            if (this.entities[name].currentWeapon && this.entities[name].currentWeapon.canShoot()) {
                var target;
                if (this.entities[name].currentWeapon.name != "sniper") {
                    target = this.decisionMaker.getAction(name, 122500);//1440000); //122500
                } else {
                    target = this.decisionMaker.getAction(name, 3240000); //122500
                }
                if (name != "player" && target) {
                    var angle = Util.getBearingDeg(this.entities[name].position, this.entities[target.name].position);
                    if (this.entities[name].currentWeapon.name == "grenadeLauncher") {
                        if (this.entities[name].isFacedRight()) {
                            angle -= Math.random() * 30;
                        } else {
                            angle += Math.random() * 30;
                        }
                    } else if (this.entities[name].currentWeapon.name != "sniper") {
                        if (this.entities[name].isFacedRight()) {
                            angle -= -10 + Math.random() * 20;
                        } else {
                            angle += -10 + Math.random() * 20;
                        }
                    }
                    this.entities[name].setAimAngle(angle);
                    this.entities[name].shoot();
                }
            }
            this.entities[name].update(delta);
        }

        for (name in this.entitiesToSpawn) {
            this.entitiesToSpawn[name] -= delta;
            if (this.entitiesToSpawn[name] <= 0) {
                this.respawnEntity(name);
                delete this.entitiesToSpawn[name];
            }
        }

        for (name in this.ragdolls) {
            this.ragdolls[name].update(delta);
        }
    };

    EntityManager.prototype.hit = function (name, force, isHead, dV, gunner) {
        if (this.entities[name]) {
            if (this.entities[name].isEnemy) {
                this.entities[name].hp -= force*Config.enemyHitMultiplier;
            } else {
                this.entities[name].hp -= force*Config.friendHitMultiplier;
            }
            if (this.entities[name].hp <= 0 && !this.entities[name].killed) {
                gunner.score++;
                var facedRight = this.entities[name].isFacedRight();
                var physAngle = this.entities[name].aimBearing - 90;
                var entityOriginalVelocity = this.entities[name].getVelocity();
                this.entities[name].kill();

                var poseData = {pHandR: physAngle, handR: physAngle, pHandL: physAngle, handL: physAngle};

                var splitData = {};
                if (isHead && force >= 100) {
                    splitData.headJointOff = true;
                }

                var ragDoll = Physics.createRagDoll(this.entities[name].position.x, this.entities[name].position.y - 9,
                    splitData,
                    poseData, facedRight);
                this.addRagDoll(ragDoll, facedRight);
                Physics.setRagDollVelocity(ragDoll, entityOriginalVelocity);
                if (isHead) {
                    Physics.addImpulse(ragDoll.head, dV.x * 0.001, dV.y * 0.001);
                }
                Physics.addImpulse(ragDoll.body, dV.x * 0.003, dV.y * 0.003);
                this.killEntity(name);
            }
        }
    };

    EntityManager.prototype.explode = function (explodeData, parentID) {
        Sound.playSound("explosion", {volume:1});
        for (var i = 0; i < explodeData.length; i++) {
            this.hitExplosion(explodeData[i].data.id, explodeData[i], parentID);
        }
    };

    EntityManager.prototype.hitExplosion = function (name, impulseData, parentID) {
        if (this.entities[name]) {
            var force = impulseData.force / 0.07 * 100;
            if (name == parentID) force *= 0.8; // let's make us a bit immune
            if (this.entities[name].isEnemy) {
                this.entities[name].hp -= force*Config.enemyHitMultiplier;
            } else {
                this.entities[name].hp -= force*Config.friendHitMultiplier;
            }
            if (this.entities[name].hp <= 0 && !this.entities[name].killed) {
                if (this.entities[name].isEnemy != this.entities[parentID].isEnemy) this.entities[parentID].score++;

                var facedRight = this.entities[name].isFacedRight();
                var physAngle = this.entities[name].aimBearing - 90;
                var entityOriginalVelocity = this.entities[name].getVelocity();
                this.entities[name].kill();

                var poseData = {pHandR: physAngle, handR: physAngle, pHandL: physAngle, handL: physAngle};
                var ragdoll = Physics.createRagDoll(this.entities[name].position.x, this.entities[name].position.y - 9,
                    {
                        headJointOff: Math.random() > 0.8,
                        pLegLJointOff: Math.random() > 0.8,
                        legLJointOff: Math.random() > 0.9,
                        pLegRJointOff: Math.random() > 0.8,
                        legRJointOff: Math.random() > 0.9,
                        pHandLJointOff: Math.random() > 0.8,
                        handLJointOff: Math.random() > 0.9,
                        pHandRJointOff: Math.random() > 0.8,
                        handRJointOff: Math.random() > 0.9
                    },
                    poseData, facedRight);
                this.addRagDoll(ragdoll, facedRight);
                Physics.addRagDollImpulse(ragdoll, impulseData, entityOriginalVelocity);
                this.killEntity(name);
            } else if (!this.entities[name].killed) {
                Physics.addImpulse(this.entities[name].body.body, Math.cos(impulseData.angle) * impulseData.force*100, Math.sin(impulseData.angle) * impulseData.force*100);
            }
        }
    };

    EntityManager.prototype.respawnEntity = function (name) {
        var spawn = {x: 0, y: 0};
        if (!this.entities[name].isEnemy) {
            spawn = this.friendSpawnPoints[Math.floor(Math.random() * this.friendSpawnPoints.length)];
        } else {
            spawn = this.enemySpawnPoints[Math.floor(Math.random() * this.enemySpawnPoints.length)];
        }
        this.entities[name].respawn(spawn.x, spawn.y);
        var entityType = (this.entities[name].isEnemy) ? "enemy" : "friend";
        var weapon = "";
        if (this.entities[name].currentWeapon) weapon = this.entities[name].currentWeapon.name;
        this.decisionMaker.addEntity(this.entities[name].id, entityType, this.entities[name].position, weapon);
    };

    EntityManager.prototype.killEntity = function (name) {
        if (this.entities[name].isEnemy) {
            if (this.flags.friend.hasFlag && this.flags.friend.attachedTo == name) {
                this.flags.friend.attachedTo = undefined;
                this.flags.friend.body = Physics.addBoxObject("friendFlag", this.entities[name].position.x, this.entities[name].position.y-5, 10, false, false);
                this.flags.friend.position = {x: this.entities[name].position.x, y: this.entities[name].position.y - 5};
            }
        } else {
            if (this.flags.enemy.hasFlag && this.flags.enemy.attachedTo == name) {
                this.flags.enemy.attachedTo = undefined;
                this.flags.enemy.body = Physics.addBoxObject("enemyFlag", this.entities[name].position.x, this.entities[name].position.y-5, 10, false, false);
                this.flags.enemy.position = {x: this.entities[name].position.x, y: this.entities[name].position.y - 5};
            }
        }
        this.decisionMaker.removeEntity(name);
        var entityType = (this.entities[name].isEnemy) ? "enemy" : "friend";
        this.score[entityType]++;
        if (!this.entities[name].spawnable) {
            delete this.entities[name];
        } else {
            this.entitiesToSpawn[name] = 3;
        }
    };

    EntityManager.prototype.getNearestEntity = function (entity, exclude) {
        var nearestID = undefined;
        var smallestDistance = 1000000;
        for (var name in this.entities) {
            if (name != entity.id && (!exclude || name.indexOf(exclude) < 0)) {
                var distance = Util.distanceSquared(entity.position, this.entities[name].position);
                if (smallestDistance > distance) {
                    smallestDistance = distance;
                    nearestID = name;
                }
            }
        }
        if (nearestID) {
            return this.entities[nearestID];
        } else {
            return undefined;
        }
    };

    EntityManager.prototype.render = function (renderer) {
        var name;
        for (name in this.entities) {
            this.entities[name].render(renderer);
            if (Config.showFriendHP && !this.entities[name].isEnemy && !this.entities[name].killed) {
                renderer.setFillStyle("rgba(255,255,255,0.4)");
                renderer.fillRect(this.entities[name].position.x - 6, this.entities[name].position.y - 29, this.entities[name].hp / 8, 2);
            }

            if (!this.entities[name].killed) {
                for (pName in this.powerUps) {
                    var pos = Physics.getBodyRealPosition(this.powerUps[pName].body);
                    var distance = Util.distanceSquared(pos, this.entities[name].position);
                    if (distance < 200 && this.entities[name].hp < 100) {
                        this.entities[name].hp = Math.min(100, this.entities[name].hp + 50);
                        Physics.removeBody(this.powerUps[pName].body);
                        delete this.powerUps[pName];
                    }
                }
            }
        }

        for (name in this.powerUps) {
            var pos = Physics.getBodyRealPosition(this.powerUps[name].body);
            var center = {x: 0, y: 0};
            var scale = {x: 1, y: 1};
            renderer.drawImageT(ImgManager.getImage("player", "hpup.png"), pos.x, pos.y, center, scale, Physics.getBodyRotation(this.powerUps[name].body));
        }

        if (this.flags.enemy.hasFlag) {
            if (this.flags.enemy.attachedTo) {
                this.flags.enemy.position = {x: this.entities[this.flags.enemy.attachedTo].position.x, y: this.entities[this.flags.enemy.attachedTo].position.y - 35};
            }
            renderer.drawImage(ImgManager.getImage("player", "blackflag.png"), this.flags.enemy.position.x, this.flags.enemy.position.y);
        }

        if (this.flags.friend.hasFlag) {
            if (this.flags.friend.attachedTo) {
                this.flags.friend.position = {x: this.entities[this.flags.friend.attachedTo].position.x, y: this.entities[this.flags.friend.attachedTo].position.y - 35};
            }
            renderer.drawImage(ImgManager.getImage("player", "whiteflag.png"), this.flags.friend.position.x, this.flags.friend.position.y);
        }

        for (name in this.ragdolls) {
            this.ragdolls[name].render(renderer);
        }
    };

    return new EntityManager();
});
