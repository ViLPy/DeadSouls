/*
 *  Dead souls project
 *
 *  Created by Vitaly Lyapin.
 *  License: CC BY-NC-SA 3.0
 */
define(['js/json.loader', 'js/entity.manager', 'js/level', 'js/img.loader', 'js/anim', 'js/entity', 'js/input', 'js/utils', 'js/config', 'js/animation.mgr', 'js/physics', 'js/bullet.manager', 'js/ui.manager', 'js/entity.helper', 'js/sound.mgr'],
    function (JSONLoader, EntityManager, Level, ImgManager, Animation, Entity, Input, Util, Config, AnimMgr, Physics, BulletManager, UIManager, EntityHelper, Sound) {
        var RENDER_STATE = {
            GAME: "game",
            MENU: "menu"
        };

        var State = function (initStateFuncPtr) {
            this.initState = initStateFuncPtr;
            this.player = undefined;
        };

        State.prototype.initScoreView = function () {
            UIManager.createView('score-table');
            var friendEntityIndex = 0;
            var enemyEntityIndex = 0;
            for (var id in EntityManager.entities) {
                var entity = EntityManager.entities[id];
                var x, y;
                if (entity.isEnemy) {
                    y = 130 + 30 * enemyEntityIndex;
                    x = 430;
                    enemyEntityIndex++;
                } else {
                    y = 130 + 30 * friendEntityIndex;
                    x = 50;
                    friendEntityIndex++;
                }
                UIManager.get('score-table').addText(id + "Name", x, y, 25, id, "#ffffff", "15px MSU1");
                UIManager.get('score-table').addText(id + "Kills", x + 200, y, 25, "0", "#ffffff", "15px MSU1");
            }
        };

        State.prototype.updateScoreView = function () {
            var friendEntityIndex = 0;
            var enemyEntityIndex = 0;
            var data = [];
            var id;
            for (id in EntityManager.entities) {
                var entity = EntityManager.entities[id];
                data.push({id: id, score: entity.score, isEnemy: entity.isEnemy});
            }

            data.sort(function (a, b) {
                return b.score - a.score;
            });

            for (var i = 0; i < data.length; i++) {
                id = data[i].id;
                var y;
                if (data[i].isEnemy) {
                    y = 130 + 30 * enemyEntityIndex;
                    enemyEntityIndex++;
                } else {
                    y = 130 + 30 * friendEntityIndex;
                    friendEntityIndex++;
                }
                UIManager.get('score-table').update(id + "Name", {y: y});
                UIManager.get('score-table').update(id + "Kills", {y: y, text: data[i].score});
            }
        };

        State.prototype.init = function () {
            var data = JSONLoader.getData("village");
            EntityManager.resetWaypoints(data.waypoints);
            this.level = new Level(data);
            EntityManager.resetSpawnPoints(this.level.enemySpawns, this.level.playerSpawns);

            var playerGfxData = {
                runAnim: new Animation("player", "PlayerRun_", ".png", 0, 54, 90, true),
                staySprite: ImgManager.getImage("player", "Player_stay.png"),
                crouchSprite: ImgManager.getImage("player", "Player_crouch.png"),
                handsSprite: ImgManager.getImage("player", "hands.png")
            };
            this.player = new Entity("player", playerGfxData, this.level.playerSpawns[0].x, this.level.playerSpawns[0].y, false);
            this.player.spawnable = true;
            this.previousOriginPos = {x: this.player.position.x, y: this.player.position.y};

            this.player.addWeapon(JSONLoader.getData("ak"));
            this.player.addWeapon(JSONLoader.getData("grenade"));
            this.player.addWeapon(JSONLoader.getData("grenadeLauncher"));
            this.player.addWeapon(JSONLoader.getData("sniper"));
            this.player.addWeapon(JSONLoader.getData("shotgun"));
            this.player.drawWeapon("ak");
            EntityManager.add(this.player);

            EntityHelper.addRunningEnemy("Andres", "ak");
            EntityHelper.addRunningEnemy("Chris", "ak");
            EntityHelper.addRunningEnemy("Braxton", "shotgun");
            //EntityHelper.addRunningEnemy("Bart", "shotgun");
            EntityHelper.addRunningEnemy("Febian", "sniper");
            EntityHelper.addRunningEnemy("Chester", "grenadeLauncher");

            EntityHelper.addRunningFriend("Daray", "ak");
            //EntityHelper.addRunningFriend("Corbin", "shotgun");
            EntityHelper.addRunningFriend("Elliott", "shotgun");
            EntityHelper.addRunningFriend("Samuel", "grenadeLauncher");
            EntityHelper.addRunningFriend("Sebastian", "sniper");
            EntityManager.spawnFlags();
            Config.enemyHitMultiplier = 0.6;
            Config.friendHitMultiplier = 0.5;
            Config.showFriendHP = true;
            Config.lastHPUpRespawn = Config.hpUpRespawnTime;
            this.renderState = RENDER_STATE.GAME;
            this.initScoreView();

            UIManager.get('menu-common').update("sound", {src:Config.soundSettingsLevelIcons[Config.soundSettings()]});
        };

        State.prototype.initInput = function () {
            Input.clearAllState();
            Input.unbindAll();

            Input.bind(Input.KEYS.TAB, "score_menu");
            Input.bind(Input.KEYS.W, "gogogo");
            Input.bind(Input.KEYS.MOUSE1, "mouse1");
            Input.bind(Input.KEYS['1'], "weapon_1");
            Input.bind(Input.KEYS['2'], "weapon_2");
            Input.bind(Input.KEYS['3'], "weapon_3");
            Input.bind(Input.KEYS['4'], "weapon_4");
            Input.bind(Input.KEYS.E, "grenade");
            Input.bind(Input.KEYS.Q, "aim");
            Input.bind(Input.KEYS.SPACE, "jump");
            Input.bind(Input.KEYS.A, "moveLeft");
            Input.bind(Input.KEYS.D, "moveRight");
            Input.bind(Input.KEYS.S, "moveDown");
            Input.bind(Input.KEYS.CTRL, "crouch");
            Input.bind(Input.KEYS.SHIFT, "run");
            Input.bind(Input.KEYS.R, "reload");
            Input.bind(Input.KEYS.ESC, "esc_menu");
        };

        State.prototype.updateHUD = function () {
            var defaultAlpha = 0.3;
            var iconsAlpha = {
                "akPic": defaultAlpha,
                "grenadeLauncherPic": defaultAlpha,
                "sniperPic": defaultAlpha,
                "shotgunPic": defaultAlpha
            };
            var currentWeapon = "machinegun.png";
            if (this.player.currentWeapon.name == "ak") {
                iconsAlpha.akPic = 1;
            }
            if (this.player.currentWeapon.name == "grenadeLauncher") {
                iconsAlpha.grenadeLauncherPic = 1;
                currentWeapon = "rocketlauncher.png";
            }
            if (this.player.currentWeapon.name == "sniper") {
                iconsAlpha.sniperPic = 1;
                currentWeapon = "sniper.png";
            }
            if (this.player.currentWeapon.name == "shotgun") {
                iconsAlpha.shotgunPic = 1;
                currentWeapon = "shotgun.png";
            }

            UIManager.get('game-hud').update("weapon", {src: currentWeapon});

            for (var id in this.player.weapons) {
                var weapon = this.player.weapons[id];
                var status = 0;
                if (weapon.isReloading) {
                    status = weapon.getReloadStatus() / 2;
                } else {
                    status = (weapon.currentAmmo / weapon.ammoAmount) * 50;
                }
                UIManager.get('game-hud').update(weapon.name + "Status", {w: status});
                UIManager.get('game-hud').update(weapon.name + "Pic", {alpha: iconsAlpha[weapon.name + "Pic"]});
            }
        };

        State.prototype.renderMenu = function (renderer, guiRenderer) {
            guiRenderer.clear();
            var mousePosition = Input.mousePosition();

            if (UIManager.get("game-menu").pointOnElement("restart", mousePosition) && Input.clicked("mouse1")) {
                this.initState(Config.STATES.ARENA_GAME);
                return;
            }
            if (UIManager.get("game-menu").pointOnElement("exit", mousePosition) && Input.clicked("mouse1")) {
                this.initState(Config.STATES.MAIN_MENU);
                return;
            }

            if (Input.clicked("esc_menu")) {
                guiRenderer.clear();
                this.renderState = RENDER_STATE.GAME;
                return;
            }

            this.level.render(renderer);
            this.level.renderFG(renderer);
            UIManager.get("game-menu").render(guiRenderer, mousePosition);

            if (UIManager.get('menu-common').pointOnElement("sound", mousePosition) && Input.clicked("mouse1")) {
                var soundSetting = (Config.soundSettings()+1) % Config.soundSettingsLevelIcons.length;
                Config.soundSettings(soundSetting);
                UIManager.get('menu-common').update("sound", {src:Config.soundSettingsLevelIcons[Config.soundSettings()]});
                Sound.updateVolume(soundSetting);
            }
            UIManager.get('menu-common').render(guiRenderer, mousePosition);
        };

        State.prototype.updateAndRenderGame = function (delta, renderer, guiRenderer) {
            var playerPosition = this.player.position;

            var mousePosition = renderer.translateCoordinatesV(Input.mousePosition());
            var aimBearing = Util.getBearingDeg(playerPosition, mousePosition);
            this.player.setAimAngle(aimBearing);
            this.player.setAimPoint(mousePosition);

            var distance;
            var dv;
            if (Input.pressed("aim")) {
                var newPos = {x: playerPosition.x + (Input.mousePosition().x - 400) * 3, y: playerPosition.y + (Input.mousePosition().y - 300) * 3};
                newPos.x = Math.max(400, Math.min(newPos.x, Config.worldWidth - 400));
                newPos.y = Math.max(300, Math.min(newPos.y, Config.worldHeight - 300));
                dv = Util.getVector(this.previousOriginPos, newPos);
                distance = Util.distance(this.previousOriginPos, newPos);
                if (distance > 1) {
                    this.previousOriginPos.x += dv.x * distance * 0.5;
                    this.previousOriginPos.y += dv.y * distance * 0.5;
                }
            } else {
                dv = Util.getVector(this.previousOriginPos, playerPosition);
                distance = Util.distance(this.previousOriginPos, playerPosition);
                if (distance > 1) {
                    this.previousOriginPos.x += dv.x * distance * 0.2;
                    this.previousOriginPos.y += dv.y * distance * 0.2;
                }
            }
            renderer.setOriginPosition(-this.previousOriginPos.x + 400, -this.previousOriginPos.y + 400);

            if (Config.lastHPUpRespawn >= Config.hpUpRespawnTime) {
                EntityManager.addHPUp();
                Config.lastHPUpRespawn = 0;
            }
            Config.lastHPUpRespawn += delta;

            if (Input.clicked("weapon_1")) {
                this.player.drawWeapon("ak");
            }

            if (Input.clicked("weapon_2")) {
                this.player.drawWeapon("shotgun");
            }

            if (Input.clicked("weapon_3")) {
                this.player.drawWeapon("grenadeLauncher");
            }

            if (Input.clicked("weapon_4")) {
                this.player.drawWeapon("sniper");
            }

            if (Input.clicked("reload")) {
                this.player.currentWeapon.reload();
            }

            if (Input.clicked("grenade")) {
                var weapon = this.player.currentWeapon.name;
                this.player.drawWeapon("grenade");
                this.player.shoot();
                this.player.drawWeapon(weapon);
            }

            if (Input.clicked("gogogo")) {
                EntityManager.forceFriendAttack();
            }

            if (Input.pressed("mouse1")) {
                this.player.shoot();
            }

            this.player.crouch(Input.pressed("crouch"));

            this.player.setRunning(Input.pressed("run"));

            if (Input.pressed("moveLeft")) {
                this.player.moveLeft();
            }

            if (Input.pressed("moveDown")) {
                this.player.setMovingDown(true);
            } else {
                this.player.setMovingDown(false);
            }

            if (Input.pressed("moveRight")) {
                this.player.moveRight();
            }
            if (Input.pressed("jump")) {
                this.player.jump();
            }

            if (Input.clicked("esc_menu")) {
                guiRenderer.clear();
                this.renderState = RENDER_STATE.MENU;
                return;
            }

            EntityManager.update(delta);
            AnimMgr.update(delta);

            //rendering
            //this.renderer.clear();
            this.level.render(renderer);

            Physics.update(delta, renderer);

            BulletManager.updateAndRender(delta, renderer);
            EntityManager.render(renderer);

            AnimMgr.render(renderer);
            this.level.renderFG(renderer);

            if (Input.pressed("score_menu")) {
                this.updateScoreView();
                guiRenderer.clear();
                UIManager.get('score').render(guiRenderer);
                UIManager.get('score-table').render(guiRenderer);
            } else {
                guiRenderer.clear();
                this.updateHUD();
                UIManager.get('game-hud').update("hp", {w: Math.max(0, this.player.hp) * 1.5});
                UIManager.get('game-hud').update("ammo", {text: Math.max(0, this.player.currentWeapon.currentAmmo) + "/"+ Math.max(0, this.player.currentWeapon.totalAmmo)});
                UIManager.get('game-hud').update("grenadeAmmo", {text: Math.max(0, this.player.weapons["grenade"].currentAmmo)});
                UIManager.get('game-hud').update("enemyFlagCaptured", {alpha: (EntityManager.flags.enemy.attachedTo)?1:0});
                UIManager.get('game-hud').update("friendFlagCaptured", {alpha: (EntityManager.flags.friend.attachedTo)?1:0});
                UIManager.get('game-hud').update("score", {text: EntityManager.flagScore.friend + " - " + EntityManager.flagScore.enemy});
                UIManager.get('game-hud').render(guiRenderer);
            }
        };

        State.prototype.updateAndRender = function (delta, renderer, guiRenderer) {
            switch (this.renderState) {
                case RENDER_STATE.MENU:
                    this.renderMenu(renderer, guiRenderer);
                    break;
                case RENDER_STATE.GAME:
                    this.updateAndRenderGame(delta, renderer, guiRenderer);
                    break;
            }

            guiRenderer.drawImage(ImgManager.getImage("player", "crosshair.png"), Input.mousePosition().x, Input.mousePosition().y);
        };
        return State;
    });