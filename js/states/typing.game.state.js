/*
 *  Dead souls project
 *
 *  Created by Vitaly Lyapin.
 *  License: CC BY-NC-SA 3.0
 */
define(['js/json.loader', 'js/entity.manager', 'js/level', 'js/img.loader', 'js/anim', 'js/entity', 'js/input', 'js/utils', 'js/config', 'js/animation.mgr', 'js/physics', 'js/bullet.manager', 'js/typing', 'js/entity.helper', 'js/ui.manager', 'js/sound.mgr'],
    function (JSONLoader, EntityManager, Level, ImgManager, Animation, Entity, Input, Util, Config, AnimMgr, Physics, BulletManager, Typing, EntityHelper, UIManager, Sound) {
        var RENDER_STATE = {
            GAME: "game",
            MENU: "menu",
            SCORE: "score"
        };

        var State = function (initStateFuncPtr) {
            this.initState = initStateFuncPtr;
        };

        State.prototype.init = function (params) {
            var data = JSONLoader.getData("map3");
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
            //this.player.setMovementSpeed(5);

            this.player.addWeapon(JSONLoader.getData("typing.sniper"));
            this.player.addWeapon(JSONLoader.getData("typing.rocket"));
            this.player.drawWeapon("typing.sniper");

            EntityManager.add(this.player);

            this.typing = new Typing(JSONLoader.getData("wordsList").wordsList);
            if (params && params.mode == "modeHome") {
                this.typing.setHomeRowMode(true);
            }

            this.multipler = 1;
            EntityHelper.addZombieEnemy(this.multipler/10);
            this.score = 0;
            this.lifeAmount = 10;
            this.toKill = 1;
            this.amountOfZombies = 1;
            this.renderState = RENDER_STATE.GAME;
            this.isGameOver = false;
            Config.enemyHitMultiplier = 1;
            Config.friendHitMultiplier = 1;

            UIManager.get('menu-common').update("sound", {src:Config.soundSettingsLevelIcons[Config.soundSettings()]});
        };

        State.prototype.initInput = function () {
            Input.clearAllState();
            Input.unbindAll();

            Input.initTyping();
            Input.bind(Input.KEYS.MOUSE1, "mouse1");
            Input.bind(Input.KEYS.ENTER, "grenade");
            Input.bind(Input.KEYS.ESC, "esc_menu");
            Input.bind(Input.KEYS.BACKSPACE, "dunno"); // ignore backspace
        };

        //this is quite specific, so hold it here
        State.prototype.updateEntitiesAndGetNextLeftEntity = function (entity, dx) {
            this.totalEntities = 0;
            var nearestID = undefined;
            var smallestDistance = 1000000;
            for (var name in EntityManager.entities) {
                this.totalEntities++;
                if (name != entity.id && EntityManager.entities[name].position.x > (entity.position.x + dx)) {
                    var distance = EntityManager.entities[name].position.x - entity.position.x;
                    if (smallestDistance > distance) {
                        smallestDistance = distance;
                        nearestID = name;
                    }
                } else if (name != entity.id) {
                    if (EntityManager.distanceToTarget(name) < 400) { // enemy passed
                        this.lifeAmount--;
                        if (this.lifeAmount <= 0) {
                            this.isGameOver = true;
                            this.renderState = RENDER_STATE.SCORE;
                            return undefined;
                        }
                        EntityManager.killEntity(name);
                        this.zombieKilled();
                    }
                }
            }
            var zombiesToCreate = this.amountOfZombies - (this.totalEntities - 1);
            if (zombiesToCreate > 0) {
                for (var i = 0; i< zombiesToCreate; i++) {
                    this.zombieKilled();
                }
            }
            if (nearestID) {
                return EntityManager.entities[nearestID];
            } else {
                return undefined;
            }
        };

        State.prototype.renderMenu = function (renderer, guiRenderer) {
            guiRenderer.clear();
            var mousePosition = Input.mousePosition();

            if (UIManager.get("game-menu").pointOnElement("restart", mousePosition) && Input.clicked("mouse1")) {
                this.initState(Config.STATES.TYPING_GAME, {mode: (this.typing.homeRow)?"modeHome":""});
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

        State.prototype.renderScore = function (renderer, guiRenderer) {
            guiRenderer.clear();
            var mousePosition = Input.mousePosition();

            if (UIManager.get("typing-score-window").pointOnElement("exit", mousePosition) && Input.clicked("mouse1")) {
                this.initState(Config.STATES.MAIN_MENU);
                return;
            }
            if (UIManager.get("typing-score-window").pointOnElement("restart", mousePosition) && Input.clicked("mouse1")) {
                this.initState(Config.STATES.TYPING_GAME, {mode: (this.typing.homeRow)?"modeHome":""});
                return;
            }

            this.level.render(renderer);
            this.level.renderFG(renderer);
            UIManager.get("typing-score-window").update("score", {text: "Score: " + this.score});
            UIManager.get("typing-score-window").update("wpm", {text: "Words/minute: " + this.typing.getWPM()});
            UIManager.get("typing-score-window").render(guiRenderer, mousePosition);
        };

        State.prototype.zombieKilled = function(name) {
            this.toKill = ++this.toKill % 10;
            if (this.toKill === 0) {
                this.amountOfZombies++;
                this.multipler+=0.1;
                EntityHelper.addZombieEnemy(this.multipler/10); // additional zombie
                this.toKill = 1;
            }
            EntityHelper.addZombieEnemy(this.multipler/10);
        };

        State.prototype.updateAndRenderGame = function (delta, renderer, guiRenderer) {
            var aimBearing;

            var playerPosition = this.player.position;
            renderer.setOriginPosition(-380, -400);
            var usingRockets = Input.clicked("grenade");

            var nearest = this.updateEntitiesAndGetNextLeftEntity(this.player, 40);
            if (this.isGameOver) return;
            if (nearest) {
                var nearestPosition = nearest.position;
                if (Math.abs(nearestPosition.x - this.player.position.x) < 680 && (this.typing.type(Input.clickedKey()) || usingRockets)) { // visible only
                    nearestPosition.y -= 5 + Math.random() * 5; // aim to a body
                    aimBearing = Util.getBearingDeg(playerPosition, nearestPosition);
                    this.player.setAimAngle(aimBearing);
                    if (!usingRockets) {
                        this.player.shoot();
                    } else {
                        this.player.drawWeapon("typing.rocket");
                        this.player.shoot();
                        this.player.drawWeapon("typing.sniper");
                    }
                    if (this.typing.isComplete()) {
                        EntityManager.hit(nearest.id, 1000, Math.random() > 0.8, {x: 5000, y: 0}, this.player);
                        this.score += this.typing.currentWord.length * (~~this.multipler);
                        this.typing.getNextWord();
                        this.zombieKilled();
                    }
                }
            }

            if (Input.clicked("esc_menu")) {
                guiRenderer.clear();
                this.renderState = RENDER_STATE.MENU;
                return;
            }

            EntityManager.update(delta);
            AnimMgr.update(delta);
            Physics.update(delta);

            this.level.render(renderer);

            BulletManager.updateAndRender(delta, renderer);
            EntityManager.render(renderer);

            AnimMgr.render(renderer);
            this.level.renderFG(renderer);

            this.typing.render(400, 530, renderer);

            guiRenderer.clear();
            UIManager.get("typing-game").update("score", {text: "Score: " + this.score});
            UIManager.get("typing-game").update("wpm", {text: "Words per minute: " + this.typing.getWPM()});
            UIManager.get("typing-game").update("lifeAmount", {text: "POP. " + this.lifeAmount * 1000});
            UIManager.get("typing-game").update("grenadesAmount", {text: this.player.weapons['typing.rocket'].currentAmmo});
            UIManager.get("typing-game").render(guiRenderer);
        };

        State.prototype.updateAndRender = function (delta, renderer, guiRenderer) {
            switch (this.renderState) {
                case RENDER_STATE.MENU:
                    this.renderMenu(renderer, guiRenderer);
                    break;
                case RENDER_STATE.GAME:
                    this.updateAndRenderGame(delta, renderer, guiRenderer);
                    break;
                case RENDER_STATE.SCORE:
                    this.renderScore(renderer, guiRenderer);
                    break;
            }
            guiRenderer.drawImage(ImgManager.getImage("player", "crosshair.png"), Input.mousePosition().x, Input.mousePosition().y);
        };
        return State;
    });