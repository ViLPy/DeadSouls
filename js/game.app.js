/*
 *  Dead souls project
 *
 *  Created by Vitaly Lyapin.
 *  License: CC BY-NC-SA 3.0
 */
define([
    'jquery',
    'underscore',
    'js/gfx',
    'js/utils',
    'js/img.loader',
    'js/physics',
    'js/input',
    'js/json.loader',
    'js/sound.mgr',
    'js/config',
    'js/ui.manager',
    'js/state.mgr'
], function ($, _, Renderer, Util, ImgManager, Physics, Input, JSONLoader, Sound, Config, UIManager, StateManager) {
    $(window).resize(function () {
        $('canvas').css({
            position:'absolute',
            left:($(window).width()
                - $('canvas').outerWidth()) / 2,
            top:($(window).height()
                - $('canvas').outerHeight()) / 2
        });
    });

    var AppView = function () {
        window.app = this;

        var canvas = $('<canvas>');
        canvas.attr('width', 800);
        canvas.attr('height', 600);
        $('body').append(canvas);

        var guiCanvas = $('<canvas>');
        guiCanvas.attr('width', 800);
        guiCanvas.attr('height', 600);
        $('body').append(guiCanvas);
        $(window).resize();
        $("#loadingPlaceholder").hide();

        Input.init(guiCanvas[0]);

        this.renderer = new Renderer(canvas[0].getContext('2d'), 800, 600);
        this.guiRenderer = new Renderer(guiCanvas[0].getContext('2d'), 800, 600);

        JSONLoader.addResource("map2", "data/map2.json");
        JSONLoader.addResource("map3", "data/map3.json");
        JSONLoader.addResource("village", "data/village_new.json");
        JSONLoader.addResource("pistol", "data/pistol.json");
        JSONLoader.addResource("ak", "data/gun.json");
        JSONLoader.addResource("grenade", "data/grenade.json");
        JSONLoader.addResource("grenadeLauncher", "data/grenade.launcher.json");
        JSONLoader.addResource("sniper", "data/sniper.json");
        JSONLoader.addResource("typing.sniper", "data/typing.sniper.json");
        JSONLoader.addResource("typing.rocket", "data/typing.rocket.json");
        JSONLoader.addResource("shotgun", "data/shotgun.json");
        JSONLoader.addResource("uiData", "data/ui.json");
        JSONLoader.addResource("wordsList", "data/words.json");

        ImgManager.addResource("player", "img/player.png", "img/player.json");
        ImgManager.addResource("decals", "img/decals.png", "img/decals.json");

        Sound.addSound("shoot", "sounds/shoot.mp3");
        Sound.addSound("explosion", "sounds/explosion.mp3");
        Sound.addSound("shotgun", "sounds/shotgun.mp3");
        Sound.addSound("sniper", "sounds/sniper.mp3");
        Sound.addSound("pistol", "sounds/pistol.mp3");
        Sound.addSound("grenadeLauncher", "sounds/grenade.launcher.mp3");
        Sound.addSound("menu", "sounds/menu.mp3");
        

        this.lastCalledTime = new Date().getTime();
        this.fps = 0;
        this.delta = 0;

        this.currentState = "main-menu";
        this.renderState = "menu";

        this.renderer.setFillStyle("#202020");
        this.renderer.fillRect(0,0,800,600);
        this.renderer.setFillStyle("#a0a0a0");
        this.renderer.setStrokeType("#a0a0a0");
        this.renderer.strokeRect(60, 270, 680, 60);


        var gameInit = Util.bind(function () {
            UIManager.init(JSONLoader.getData("uiData"));
            StateManager.preFillStates();
            window.renderer();
        }, this);
        var that = this;
        // TODO: Yay, code style should be fixed
        JSONLoader.startLoading(function () {
            that.renderer.fillRect(60, 270, 226, 60);
            ImgManager.startLoading(function () {
                that.renderer.fillRect(60, 270, 453, 60);
                Sound.startLoading(gameInit);
            });
        });
    };

    AppView.prototype.render = function () {
        this.requestAnimFrame();

        StateManager.getCurrentState().updateAndRender(this.delta, this.renderer, this.guiRenderer);

        Input.clearClicks();
        this.queueNewFrame();
    };

    AppView.prototype.requestAnimFrame = function () {
        if (!this.lastCalledTime) {
            this.lastCalledTime = new Date().getTime();
            this.fps = 0;
            return;
        }
        var currentTime = new Date().getTime();
        this.delta = (currentTime - this.lastCalledTime) / 1000;
        this.lastCalledTime = currentTime;
        this.fps = 1 / this.delta;
    };

    AppView.prototype.queueNewFrame = function () {
        if (window.requestAnimationFrame)
            window.requestAnimationFrame(window.renderer);
        else if (window.msRequestAnimationFrame)
            window.msRequestAnimationFrame(window.renderer);
        else if (window.webkitRequestAnimationFrame)
            window.webkitRequestAnimationFrame(window.renderer);
        else if (window.mozRequestAnimationFrame)
            window.mozRequestAnimationFrame(window.renderer);
        else if (window.oRequestAnimationFrame)
            window.oRequestAnimationFrame(window.renderer);
        else {
            window.setTimeout(window.renderer, 16.7);
        }
    };

    window.renderer = function () {
        window.app.render();
    };
    return AppView;
});