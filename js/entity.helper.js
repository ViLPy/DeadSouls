/*
 *  Dead souls project
 *
 *  Created by Vitaly Lyapin.
 *  License: CC BY-NC-SA 3.0
 */
define(['underscore', 'js/utils', 'js/ragdoll.render', 'js/img.loader', 'js/physics', 'js/ai', 'js/config', 'js/json.loader', 'js/anim', 'js/entity.manager', 'js/entity'], 
    function (_, Util, RagDollRender, ImgManager, Physics, AI, Config, JSONLoader, Animation, EntityManager, Entity) {
    var EntityHelper = function () {};

    EntityHelper.prototype.addZombieEnemy = function (speed, name) {
        if (EntityManager.enemySpawnPoints.length == 0) return;
        var enemyGfxData = {
            runAnim:new Animation("player", "PlayerWalk_", ".png", 0, 31, 20, true),
            staySprite:ImgManager.getImage("player", "Player_stay.png"),
            headSprite:ImgManager.getImage("player", "head.png"),
            handsSprite:ImgManager.getImage("player", "zombo_hands.png")
        };
        var spawn = Util.getRandomElement(EntityManager.enemySpawnPoints);
        name = name || "enemyRun" + _.uniqueId();
        var enemy = new Entity(name, enemyGfxData, spawn.x, spawn.y, true);
        console.log(speed);
        speed = speed || 0;
        enemy.setMovementSpeed(0.3 + speed + Math.random()*0.2);
        enemy.setAimAngle(180);
        EntityManager.add(enemy);
    };

    EntityHelper.prototype.addRunningFriend = function (name, weapon) {
        if (EntityManager.friendSpawnPoints.length == 0) return;
        var enemyGfxData = {
            runAnim:new Animation("player", "PlayerRun_", ".png", 0, 54, 90, true),
            staySprite:ImgManager.getImage("player", "Player_stay.png"),
            headSprite:ImgManager.getImage("player", "head.png"),
            handsSprite:ImgManager.getImage("player", "hands.png")
        };
        var spawn = Util.getRandomElement(EntityManager.friendSpawnPoints);
        name = name || "friend" + _.uniqueId();
        var friend = new Entity(name, enemyGfxData, spawn.x, spawn.y, false);
        friend.spawnable = true;
        friend.addWeapon(JSONLoader.getData(weapon || "ak"));
        friend.drawWeapon(weapon || "ak");
        friend.setAimAngle(180);
        friend.setMovementSpeed(3 + Math.random()*0.5);
        EntityManager.add(friend);
    };

    EntityHelper.prototype.addRunningEnemy = function (name, weapon) {
        if (EntityManager.enemySpawnPoints.length == 0) return;
        var enemyGfxData = {
            runAnim:new Animation("player", "PlayerRun_", ".png", 0, 54, 90, true),
            staySprite:ImgManager.getImage("player", "Player_stay.png"),
            headSprite:ImgManager.getImage("player", "head.png"),
            handsSprite:ImgManager.getImage("player", "hands.png")
        };
        var spawn = Util.getRandomElement(EntityManager.enemySpawnPoints);
        name = name || "enemyRun" + _.uniqueId();
        var enemy = new Entity(name, enemyGfxData, spawn.x, spawn.y, true);

        if (!weapon) {
            var weaponArray = ["ak", "shotgun", "pistol"];
            weapon = Util.getRandomElement(weaponArray);
            enemy.addWeapon(JSONLoader.getData(weapon));
            enemy.drawWeapon(weapon);
        } else {
            enemy.addWeapon(JSONLoader.getData(weapon));
            enemy.drawWeapon(weapon);
            enemy.spawnable = true;
        }

        enemy.setAimAngle(180);
        enemy.setMovementSpeed(3 + Math.random()*0.5);
        EntityManager.add(enemy);
    };

    return new EntityHelper();
});