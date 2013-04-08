/*
 *  Dead souls project
 *
 *  Created by Vitaly Lyapin.
 *  License: CC BY-NC-SA 3.0
 */
define([], function () {

    var Config = function(){
        this.worldWidth =2048;
        this.worldHeight = 2048;
        this.physScale = 50;
        this.soundSettingsLevelIcons = ['sound_off.png', 'sound_on.png'];
        this.currentSoundSetting = 1;
        this.useGfxFG = true;
        this.showFriendHP = false;
        this.lastHPUpRespawn = 10;
        this.hpUpRespawnTime = 10;
        this.STATES = {
            MAIN_MENU: "mainMenu",
            TYPING_GAME: "typing",
            ARENA_GAME: "gameArena"
        };
        this.enemyHitMultiplier = 0.6;
        this.friendHitMultiplier = 0.5;

        this.fetch();
    };

    Config.prototype.fetch = function() {
        this.currentSoundSetting = parseInt(localStorage.getItem('currentSoundSetting')) || 0;
    };

    Config.prototype.persist = function() {
        localStorage.setItem('currentSoundSetting', this.currentSoundSetting);
    };

    Config.prototype.soundSettings = function(param) {
        if (param == undefined) {
            return this.currentSoundSetting;
        } else {
            this.currentSoundSetting = param;
            this.persist();
        }
    }

    return new Config();
});
