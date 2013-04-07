/*
 *  Dead souls project
 *
 *  Created by Vitaly Lyapin.
 *  License: CC BY-NC-SA 3.0
 */
define(['js/level.renderer', 'js/physics'], function (LevelRenderer, Physics) {
    var Level = function (levelData) {
        this.levelRenderer = new LevelRenderer(levelData);
        Physics.addStatic(levelData.static);

        this.playerSpawns = _(levelData.static).filter(function (entity) {
            return entity.type == "player" && (entity.plots.length == 1);
        }).map(function (data) {
                return {x:data.plots[0].x, y:data.plots[0].y};
            }).value();

        this.enemySpawns = _(levelData.static).filter(function (entity) {
            return entity.type == "enemy" && (entity.plots.length == 1);
        }).map(function (data) {
                return {x:data.plots[0].x, y:data.plots[0].y};
            }).value();
    };

    Level.prototype.render = function (renderer) {
        this.levelRenderer.render(renderer);
    };

    Level.prototype.renderFG = function (renderer) {
        this.levelRenderer.renderFG(renderer);
    };

    return Level;
});