/*
 *  Dead souls project
 *
 *  Created by Vitaly Lyapin.
 *  License: CC BY-NC-SA 3.0
 */
define(['js/utils', 'js/physics', 'js/bullet.manager', 'js/entity.manager', 'js/animation.mgr', 'js/sound.mgr', 'js/config', 'js/states/typing.game.state', 'js/states/main.menu.state', 'js/states/game.arena.state'], 
	function (Util, Physics, BulletManager, EntityManager, AnimMgr, Sound, Config, TypingGame, MainMenu, GameArena) {
 	var StateManager = function() {
        this.states = {};
        this.currentState = undefined;
    };

    StateManager.prototype.preFillStates = function() {
    	var initStateFunc = Util.bind(this.initState, this);
    	this.addState(Config.STATES.MAIN_MENU, new MainMenu(initStateFunc));
    	this.addState(Config.STATES.TYPING_GAME, new TypingGame(initStateFunc));
    	this.addState(Config.STATES.ARENA_GAME, new GameArena(initStateFunc));

    	this.initState(Config.STATES.MAIN_MENU);
    };

    StateManager.prototype.addState = function(name, state) {
		this.states[name] = state;
    };

    StateManager.prototype.initState = function(name, params) {
    	if (!this.states[name]) {
    		console.log("Unknown state " + name);
    		return;
    	}
    	EntityManager.reset();
        BulletManager.reset();
        AnimMgr.reset();
        Sound.stopAll();
        Sound.updateVolume(Config.soundSettings());
        Physics.reset();

    	this.currentState = this.states[name];
    	this.currentState.init(params);
    	this.currentState.initInput();
    };

    StateManager.prototype.getCurrentState = function() {
    	return this.currentState;
    }

    return new StateManager();
});


   