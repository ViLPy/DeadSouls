/*
 *  Dead souls project
 *
 *  Created by Vitaly Lyapin.
 *  License: CC BY-NC-SA 3.0
 */
define(['js/json.loader' ,'js/level', 'js/input', 'js/utils', 'js/config', 'js/ui.manager', 'js/sound.mgr', 'js/img.loader'],
    function (JSONLoader, Level, Input, Util, Config, UIManager, Sound, ImgManager) {
        var RENDER_STATE = {
            MAIN: "main",
            TYPING: "typing"
        };

        var State = function (initStateFuncPtr) {
            this.initState = initStateFuncPtr;
        };

        State.prototype.init = function () {
            this.level = new Level(JSONLoader.getData("map2"));
            UIManager.get('menu-common').update("sound", {src:Config.soundSettingsLevelIcons[Config.soundSettings()]});
            this.mode = RENDER_STATE.MAIN;
        };

        State.prototype.initInput = function () {
            Input.clearAllState();
            Input.unbindAll();

            Input.bind(Input.KEYS.MOUSE1, "mouse1");
        };

        State.prototype.updateAndRenderMain = function(guiRenderer, mousePosition) {
            if (UIManager.get('menu-stage1').pointOnElement("typingGame", mousePosition) && Input.clicked("mouse1")) {
                this.mode = RENDER_STATE.TYPING;
            }
            if (UIManager.get('menu-stage1').pointOnElement("battleArena", mousePosition) && Input.clicked("mouse1")) {
                this.initState(Config.STATES.ARENA_GAME);
                return;
            }

            UIManager.get('menu-stage1').render(guiRenderer, mousePosition);
        };

        State.prototype.updateAndRenderTypingSettings = function(guiRenderer, mousePosition) {
            if (UIManager.get('menu-typing-settings').pointOnElement("back", mousePosition) && Input.clicked("mouse1")) {
                this.mode = RENDER_STATE.MAIN;
            }
            if (UIManager.get('menu-typing-settings').pointOnElement("modeWords", mousePosition) && Input.clicked("mouse1")) {
                this.initState(Config.STATES.TYPING_GAME);
                return;
            }
            if (UIManager.get('menu-typing-settings').pointOnElement("modeHome", mousePosition) && Input.clicked("mouse1")) {
                this.initState(Config.STATES.TYPING_GAME, {mode: 'modeHome'});
                return;
            }
            UIManager.get('menu-typing-settings').render(guiRenderer, mousePosition);
        };

        State.prototype.updateAndRender = function (delta, renderer, guiRenderer) {
            renderer.setOriginPosition(-100, -300);

            var mousePosition = Input.mousePosition();
            this.level.render(renderer);
            this.level.renderFG(renderer);

            guiRenderer.clear();
            switch(this.mode) {
                case RENDER_STATE.MAIN:
                    this.updateAndRenderMain(guiRenderer, mousePosition);
                    break;
                case RENDER_STATE.TYPING:
                    this.updateAndRenderTypingSettings(guiRenderer, mousePosition);
                    break;
            }

            if (UIManager.get('menu-common').pointOnElement("sound", mousePosition) && Input.clicked("mouse1")) {
                var soundSetting = (Config.soundSettings()+1) % Config.soundSettingsLevelIcons.length;
                Config.soundSettings(soundSetting);
                UIManager.get('menu-common').update("sound", {src:Config.soundSettingsLevelIcons[Config.soundSettings()]});
                Sound.updateVolume(soundSetting);
            }
            UIManager.get('menu-common').render(guiRenderer, mousePosition);

            guiRenderer.drawImage(ImgManager.getImage("player", "crosshair.png"), Input.mousePosition().x, Input.mousePosition().y);
        };
        return State;
    });