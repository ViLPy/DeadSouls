/*
 *  Dead souls project
 *
 *  Created by Vitaly Lyapin.
 *  License: CC BY-NC-SA 3.0
 */
define(['underscore', 'js/utils', 'js/dijkstra', 'js/physics'], function (_, Util, Graph, Physics) {
    var Ways = function (waypointData) {
        this.waypoints = waypointData;
        this.entities = {};
        this.friends = [];
        this.enemies = [];
        this.graphMap = {};
        this.enemyTargets = [];
        this.defendPoints = [];

        this.friendFlagPoint = undefined;
        this.enemyFlagPoint = undefined;

        this.flags = {
            enemy:{
                hasFlag:false, // do we have flag on map?
                attachedTo:undefined,
                position:undefined,
                atSpawn:false // is entity at spawn?
            },
            friend:{
                hasFlag:false, // do we have flag on map?
                attachedTo:undefined,
                position:undefined,
                atSpawn:false // is entity at spawn?
            }
        };
        this.friendFlagClosest = undefined;
        this.enemyFlagClosest = undefined;

        for (var name in waypointData) {
            this.graphMap[name] = {};
            if (waypointData[name].type == "enemyTarget") this.enemyTargets.push(name);
            if (waypointData[name].type == "defendPoint") this.defendPoints.push(name);
            if (waypointData[name].type == "enemyFlag") this.enemyFlagPoint = name;
            if (waypointData[name].type == "friendFlag") this.friendFlagPoint = name;
            for (var connection in waypointData[name].connections) {
                this.graphMap[name][connection] = waypointData[name].connections[connection];
            }
        }
        this.graph = new Graph(this.graphMap);
    };

    Ways.prototype.updateFlags = function (flags) {
        this.flags = flags;
        if (flags.enemy.hasFlag) {
            this.enemyFlagClosest = this.updateClosestWaypoint(flags.enemy.position);
        }
        if (flags.friend.hasFlag) {
            this.friendFlagClosest = this.updateClosestWaypoint(flags.friend.position);
        }
    };

    Ways.prototype.getRandomKeyPoint = function () {
        var keyPoints = this.defendPoints.concat(this.enemyTargets);
        return this.waypoints[Util.getRandomElement(keyPoints)];
    };

    Ways.prototype.addEntity = function (name, type, position, weapon) {
        this.entities[name] = {type:type, position:position, target:undefined, weapon:weapon, path:undefined, pathPtr:undefined};
        if (type == "friend") {
            this.friends.push(name);
        } else if (type == "enemy") {
            this.enemies.push(name);
        }
    };

    Ways.prototype.getSquaredEntityDistanceToTarget = function(name) {
        if (!this.entities[name].target) return undefined;
        return Util.distanceSquared(this.entities[name].position, this.waypoints[this.entities[name].target].position);
    }

    Ways.prototype.updateClosestWaypoint = function (p1) {
        var closestNode = undefined;
        var closestDistance = 0;
        for (var key in this.waypoints) {
            var p2 = this.waypoints[key].position;
            var distance = Util.distanceSquared(p1, p2);
            if (distance < closestDistance || closestNode == undefined) {
                closestDistance = distance;
                closestNode = key;
            }
        }
        return closestNode;
    };

    Ways.prototype.getPathDistance = function (path) {
        var distance = 0;
        for (var i = 0; i < path.length - 1; i++) {
            distance += this.graphMap[path[i]][path[i + 1]];
        }
        return distance;
    };

    Ways.prototype.setObjectPosition = function (name, position) {
        this.entities[name].position = position;
    };

    Ways.prototype.removeEntity = function (name) {
        if (this.entities[name]) {
            var index;
            if (this.entities[name].type == "friend") {
                index = this.friends.indexOf(name);
                if (index != -1) {
                    this.friends.splice(index, 1);
                }
            } else if (this.entities[name].type == "enemy") {
                index = this.enemies.indexOf(name);
                if (index != -1) {
                    this.enemies.splice(index, 1);
                }
            }
            delete this.entities[name];
        }
    };

    Ways.prototype.updatePath = function (entity, target) {
        if (target) {
            entity.target = target;
        } else {
            if (entity.type == "enemy") {
                entity.target = this.enemyTargets[Math.floor(Math.random() * this.enemyTargets.length)];
            } else if (entity.type == "friend") {
                entity.target = this.defendPoints[Math.floor(Math.random() * this.defendPoints.length)];
            }
        }
        var shortetst = this.graph.findShortestPath(entity.closest, entity.target);
        if (!shortetst) return;
        entity.path = shortetst;
        entity.pathPtr = 1;
        if (entity.path.length == 1) entity.pathPtr = 0;
    };

    Ways.prototype.forceFriendAttack = function () {
        for (var i = 0; i < this.friends.length; i++) {
            if (this.entities[this.friends[i]].closest != this.enemyFlagPoint) {
                this.updatePath(this.entities[this.friends[i]], this.enemyFlagPoint);
            }
        }
    };

    Ways.prototype.setAsFlagHolder = function (name) {
        if (name == "player") return;
        var entity = this.entities[name];
        if (entity.type == "enemy" && this.flags.friend.hasFlag) {
            this.updatePath(entity, this.enemyFlagPoint);
        } else if (entity.type == "friend" && this.flags.enemy.hasFlag) {
            this.updatePath(entity, this.friendFlagPoint);
        }
    };

    Ways.prototype.getDirection = function (name) {
        var entity = this.entities[name];
        entity.closest = this.updateClosestWaypoint(entity.position);
        if (entity.closest == undefined) { // no waypoint data, then just move enemies towards to player
            if (entity.type == "enemy" && this.entities["player"]) {
                if (Math.abs(this.entities["player"].position.x - entity.position.x) < 5) return "stay";
                return (this.entities["player"].position.x < entity.position.x) ? "left" : "right";
            } else {
                return "stay";
            }
        }

        if (!entity.target) this.updatePath(entity);

        var distanceSquared = Util.distanceSquared(entity.position, this.waypoints[entity.path[entity.pathPtr]].position);
        var submodifier = "";

        if (entity.closest == entity.path[entity.pathPtr] && distanceSquared < 300) {
            if (Math.random() > 0.9) submodifier = "-run"
            if (entity.pathPtr == (entity.path.length - 1)) {
                this.updatePath(entity);
            } else {
                entity.pathPtr++;
            }
        }
        var modifier = "";
        var dY = this.waypoints[entity.path[entity.pathPtr]].position.y - this.waypoints[entity.closest].position.y;
        if (Math.abs(dY) > 20) {
            if (dY > 0) modifier = "-down";
            else modifier = "-up";
        }
        return ((this.waypoints[entity.path[entity.pathPtr]].position.x < entity.position.x) ? "left" : "right") + modifier + submodifier;
    };

    Ways.prototype.getAction = function (name, maxDistanceSquared) {
        var entity = this.entities[name];
        var enemies = [];
        if (entity.type == "enemy") {
            enemies = this.friends;
        } else if (entity.type == "friend") {
            enemies = this.enemies;
        }

        var validEnemies = [];
        for (var i = 0; i < enemies.length; i++) {
            var distance = Util.distanceSquared(this.entities[enemies[i]].position, entity.position);
            if (maxDistanceSquared > distance) {
                validEnemies.push({name:enemies[i], distance:distance});
            }
        }
        if (validEnemies.length == 0) return null;
        if (entity.weapon == "sniper" || entity.weapon == "grenadeLauncher") {
            var castable = [];
            for (var j = 0; j < validEnemies.length; j++) {
                var enemy = this.entities[validEnemies[j].name];
                var castResult = Physics.raycast(entity.position, enemy.position, [entity.type]);
                if (castResult && castResult.body.type == enemy.type) {
                    castable.push(validEnemies[j]);
                }
            }
            if (castable.length == 0) return null;
            return castable[Math.floor(Math.random() * castable.length)];
        } else {
            validEnemies.sort(function (a, b) {
                return a.distance - b.distance
            });
            return validEnemies[0];
        }
    };

    return Ways;
});

/*
 - Add entity with given type
 - On each iteration update entity position
 == Way decider ==
 - Retrieve entity direction:

 -- Update closest node
 -- If don't have target node, skip otherwise:
 --- if Enemy pick random enemyTarget as target
 --- if Friend pick random defendPoint as target
 --- calculate path to target
 --- set path pointer to head of path

 -- If have target node
 --- (1) If closest is not the path pointer
 ---- if closest.x > path pointer.x - return left
 ---- if closest.x < path pointer.x - return right
 --- else
 ---- if path pointer is last - return stay
 ---- else increment path pointer, goto (1)

 - Move entity in this direction
 == Action decider ==
 - Get entity action:
 -- get list of enemies
 -- filter by ranges
 -- if entity is sniper:
 --- try to raycast each and filter only visible
 --- pick random enemy
 -- else
 --- pick closest
 -- aim and shoot


 directions: left, right, stay

 {
 a: {
 connections: {b:<distance>, c:...},
 type: enemytarget,
 position: {x,y}
 }
 }

 entity types:
 - killer - everyone attack this
 - enemy - friends attack enemies
 - enemytarget - target point for enemies
 - friend - friendly to player
 - player
 - heal
 - ammo
 - grenades
 - defendpoint - point to defend for friends

 */