/*
 *  Dead souls project
 *
 *  Created by Vitaly Lyapin.
 *  License: CC BY-NC-SA 3.0
 */
define(['js/utils', 'js/box2d.min', 'js/config'], function (Util, Box2D, Config) {
    var CollisionGroups = {
        "common":{
            categoryBits:1,
            mask:15
        },
        "entity":{
            categoryBits:2,
            mask:3
        },
        "background":{
            categoryBits:4,
            mask:5
        },
        "hideout":{
            categoryBits:8,
            mask:9
        }
    };

    var Physics = function () {
        this.b2Vec2 = Box2D.Common.Math.b2Vec2;
        this.b2BodyDef = Box2D.Dynamics.b2BodyDef;
        this.b2Body = Box2D.Dynamics.b2Body;
        this.b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
        this.b2Fixture = Box2D.Dynamics.b2Fixture;
        this.b2World = Box2D.Dynamics.b2World;
        this.b2MassData = Box2D.Collision.Shapes.b2MassData;
        this.b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
        this.b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
        this.b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

        this.reset(null);
    };

    Physics.prototype.reset = function (context) {
        this.collisionCallbacks = {};

        this.world = new this.b2World(
            new this.b2Vec2(0, 10)    //gravity
            , true                 //allow sleep
        );

        //setup debug draw
        /*if (context) {
            var debugDraw = new this.b2DebugDraw();
            debugDraw.SetSprite(context);
            debugDraw.SetDrawScale(Config.physScale);
            debugDraw.SetFillAlpha(0.5);
            debugDraw.SetLineThickness(1.0);
            debugDraw.SetFlags(this.b2DebugDraw.e_shapeBit | this.b2DebugDraw.e_jointBit);
            this.world.SetDebugDraw(debugDraw);
            this.debugging = true;
            console.log("Phys debug");
        }*/

        var listener = new Box2D.Dynamics.b2ContactListener;
        var that = this;
        listener.BeginContact = function (contact) {
            var fxA = contact.GetFixtureA(); // 1st COLLISION FIXTURE
            var fxB = contact.GetFixtureB(); // 2nd COLLISION FIXTURE
            var sA = fxA.IsSensor(); // Will store whether 1st fixture is a sensor or not (true or false)
            var sB = fxB.IsSensor(); // Will store whether 2nd fixture is a sensor or not (true or false)
            var userDataA = fxA.GetBody().GetUserData();
            var userDataB = fxB.GetBody().GetUserData();

            if (userDataA.id && that.collisionCallbacks[userDataA.id] && sA == that.collisionCallbacks[userDataA.id].isSensor) {
                that.collisionCallbacks[userDataA.id].callback(userDataA, userDataB, false);
            } else if (userDataB.id && that.collisionCallbacks[userDataB.id] && sB == that.collisionCallbacks[userDataB.id].isSensor) {
                that.collisionCallbacks[userDataB.id].callback(userDataB, userDataA, false);
            }
        };

        listener.PreSolve = function(contact) {
            var fxA = contact.GetFixtureA(); // 1st COLLISION FIXTURE
            var fxB = contact.GetFixtureB(); // 2nd COLLISION FIXTURE
            var userDataA = fxA.GetBody().GetUserData();
            var userDataB = fxB.GetBody().GetUserData();

            if (userDataA.type == "floor" || userDataB.type == "floor") {
                var floor, entity, entityData;
                if (userDataA.type == "floor") {
                    floor = fxA;
                    entity = fxB;
                    entityData = userDataB;
                }
                if (userDataB.type == "floor") {
                    floor = fxB;
                    entity = fxA;
                    entityData = userDataA;
                }

                var entityY = entity.GetBody().GetPosition().y;
                var floorY = floor.GetBody().GetPosition().y;

                if ((entityY > floorY) || entityData.isHead || entityData.movingDown) contact.SetEnabled(false);
            }
        };

        listener.EndContact = function (contact) {
            var fxA = contact.GetFixtureA(); // 1st COLLISION FIXTURE
            var fxB = contact.GetFixtureB(); // 2nd COLLISION FIXTURE
            var sA = fxA.IsSensor(); // Will store whether 1st fixture is a sensor or not (true or false)
            var sB = fxB.IsSensor(); // Will store whether 2nd fixture is a sensor or not (true or false)
            var userDataA = fxA.GetBody().GetUserData();
            var userDataB = fxB.GetBody().GetUserData();

            if (userDataA.id && that.collisionCallbacks[userDataA.id] && sA == that.collisionCallbacks[userDataA.id].isSensor) {
                that.collisionCallbacks[userDataA.id].callback(userDataA, userDataB, true);
            } else if (userDataB.id && that.collisionCallbacks[userDataB.id] && sB == that.collisionCallbacks[userDataB.id].isSensor) {
                that.collisionCallbacks[userDataB.id].callback(userDataB, userDataA, true);
            }
        };
        this.world.SetContactListener(listener);
    };

    Physics.prototype.addCollisionCallback = function (id, isSensor, callback) {
        this.collisionCallbacks[id] = {
            "isSensor":isSensor,
            "callback":callback // (userData, userData2, normal, points, isEnded)
        };
    };

    Physics.prototype.removeCollisionCallback = function (name) {
        delete this.collisionCallbacks[name];
    };

    Physics.prototype.addPlayer = function (x, y, id, isEnemy) {
        var userData = {
            id:id,
            isHead:false,
            movingUp: false,
            movingDown: false,
            type:(isEnemy) ? "enemy" : "friend"
        };

        var group = CollisionGroups.entity;

        var fixDef = new this.b2FixtureDef;
        fixDef.density = 1.0;
        fixDef.friction = 0.1;
        fixDef.restitution = 0;
        fixDef.filter.categoryBits = group.categoryBits;
        fixDef.filter.maskBits = group.mask;
        fixDef.filter.groupIndex = -2;//(isEnemy) ? -2 : -4
        fixDef.shape = new this.b2PolygonShape;
        fixDef.shape.SetAsOrientedBox(
            5 / Config.physScale, //half width
            8 / Config.physScale, //half height
            new this.b2Vec2(0, -7 / Config.physScale),
            0
        );

        // colision base
        var fx1 = new this.b2FixtureDef;
        fx1.shape = new this.b2CircleShape(7 / Config.physScale);
        fx1.density = 1.0;
        fx1.friction = 0.1;
        fx1.restitution = 0;
        fx1.filter.categoryBits = group.categoryBits;
        fx1.filter.maskBits = group.mask;
        fx1.filter.groupIndex = -2;//(isEnemy) ? -2 : -4

        // sensor
        var fx2 = new this.b2FixtureDef;
        fx2.shape = new this.b2PolygonShape;
        fx2.shape.SetAsOrientedBox(
            4 / Config.physScale, //half width
            1 / Config.physScale, //half height
            new this.b2Vec2(0, 8 / Config.physScale),
            0
        );
        fx2.density = 0;
        fx2.filter.categoryBits = group.categoryBits;
        fx2.filter.maskBits = group.mask;
        fx2.filter.groupIndex = 2;//(isEnemy) ? -2 : -4
        fx2.isSensor = true;

        var bodyDef = new this.b2BodyDef;
        bodyDef.userData = userData;
        bodyDef.type = this.b2Body.b2_dynamicBody;
        bodyDef.position.x = x / Config.physScale;
        bodyDef.position.y = y / Config.physScale;
        var body = this.world.CreateBody(bodyDef);
        body.CreateFixture(fx2);
        body.CreateFixture(fixDef);
        body.CreateFixture(fx1);
        body.SetFixedRotation(true);

        // head
        var fxH = new this.b2FixtureDef;
        fxH.shape = new this.b2CircleShape(5 / Config.physScale);
        fxH.density = 1.0;
        fxH.friction = 0.1;
        fxH.restitution = 0;
        fxH.filter.categoryBits = group.categoryBits;
        fxH.filter.maskBits = group.mask;
        fxH.filter.groupIndex = -2;//(isEnemy) ? -2 : -4

        var headDef = new this.b2BodyDef;
        headDef.type = this.b2Body.b2_dynamicBody;

        var userHeadData = _.clone(userData);
        userHeadData.isHead = true;
        headDef.userData = userHeadData;

        headDef.position.x = x / Config.physScale;
        headDef.position.y = (y - 19) / Config.physScale;
        var head = this.world.CreateBody(headDef);
        head.CreateFixture(fxH);

        var weldJointDef = new Box2D.Dynamics.Joints.b2WeldJointDef();
        weldJointDef.Initialize(body, head, body.GetWorldCenter());
        this.world.CreateJoint(weldJointDef);


        var fxS = new this.b2FixtureDef;
        fxS.shape = new this.b2PolygonShape;
        fxS.shape.SetAsOrientedBox(
            7 / Config.physScale, //half width
            7 / Config.physScale, //half height
            new this.b2Vec2(0, - 3 / Config.physScale),
            0
        );
        fxS.density = 1.0;
        fxS.friction = 0.1;
        fxS.restitution = 0;
        fxS.filter.categoryBits = CollisionGroups.background.categoryBits;
        fxS.filter.maskBits = CollisionGroups.background.mask;
        fxS.filter.groupIndex = -1;

        var sittingDef = new this.b2BodyDef;
        sittingDef.type = this.b2Body.b2_dynamicBody;
        sittingDef.userData = userData;
        sittingDef.position.x = x / Config.physScale;
        sittingDef.position.y = y / Config.physScale;
        var sitting = this.world.CreateBody(sittingDef);
        sitting.CreateFixture(fxS);

        var weldJointDef = new Box2D.Dynamics.Joints.b2WeldJointDef();
        weldJointDef.Initialize(body, sitting, body.GetWorldCenter());
        this.world.CreateJoint(weldJointDef);

        sitting.SetActive(false);
        return {body:body, head:head, sitting:sitting};
    };

    Physics.prototype.createRagDoll = function (x, y, jointData, pose, faceRight) {
        var that = this;

        function addBodyPart(position) {
            var fixPart = new Box2D.Dynamics.b2FixtureDef;
            fixPart.density = 1.0;
            fixPart.friction = 0.5;
            fixPart.restitution = 0.2;
            fixPart.filter.groupIndex = -1;
            fixPart.filter.categoryBits = CollisionGroups.background.categoryBits;
            fixPart.filter.maskBits = CollisionGroups.background.mask;

            fixPart.shape = new Box2D.Collision.Shapes.b2PolygonShape;
            fixPart.shape.SetAsOrientedBox(
                2 / Config.physScale, //half width
                3 / Config.physScale, //half height
                new Box2D.Common.Math.b2Vec2(0, 5 / Config.physScale),
                0
            );

            var partBodyDef = new that.b2BodyDef;
            partBodyDef.type = that.b2Body.b2_dynamicBody;
            partBodyDef.userData = {
                type:"gib"
            };

            partBodyDef.position.x = position.x;
            partBodyDef.position.y = position.y;
            var bodyPart = that.world.CreateBody(partBodyDef);
            bodyPart.CreateFixture(fixPart);

            return bodyPart;
        }

        function addJoint(a, b, limit, lower, upper) {
            var joint = new Box2D.Dynamics.Joints.b2RevoluteJointDef();
            var jointPos = b.GetWorldCenter();
            jointPos.y -= 4 / Config.physScale;
            joint.Initialize(a, b, jointPos);
            if (limit) {
                joint.lowerAngle = lower;
                joint.upperAngle = upper;
            }
            joint.enableLimit = limit;
            return that.world.CreateJoint(joint);
        }

        // body
        var fixBody = new this.b2FixtureDef;
        fixBody.density = 1.0;
        fixBody.friction = 0.5;
        fixBody.restitution = 0.2;
        fixBody.filter.groupIndex = -1;
        fixBody.filter.categoryBits = CollisionGroups.background.categoryBits;
        fixBody.filter.maskBits = CollisionGroups.background.mask;

        fixBody.shape = new this.b2PolygonShape;
        fixBody.shape.SetAsBox(
            2 / Config.physScale, //half width
            6 / Config.physScale //half height
        );

        var bodyDef = new this.b2BodyDef;
        bodyDef.userData = {
            type:"gib"
        };
        bodyDef.type = this.b2Body.b2_dynamicBody;
        bodyDef.position.x = x / Config.physScale;
        bodyDef.position.y = y / Config.physScale;
        var body = this.world.CreateBody(bodyDef);
        body.CreateFixture(fixBody);

        // head
        var fixHead = new this.b2FixtureDef;
        fixHead.density = 1.0;
        fixHead.friction = 0.5;
        fixHead.restitution = 0.2;
        fixHead.filter.groupIndex = -1;
        fixHead.filter.categoryBits = CollisionGroups.background.categoryBits;
        fixHead.filter.maskBits = CollisionGroups.background.mask;

        fixHead.shape = new this.b2CircleShape(4 / Config.physScale);

        var headDef = new this.b2BodyDef;
        headDef.type = this.b2Body.b2_dynamicBody;
        headDef.userData = {
            type:"gib"
        };

        headDef.position.x = x / Config.physScale;
        headDef.position.y = (y - 10) / Config.physScale;
        var head = this.world.CreateBody(headDef);
        head.CreateFixture(fixHead);

        if (!jointData.headJointOff) {
            var bodyHeadJoint = new Box2D.Dynamics.Joints.b2RevoluteJointDef();
            var bodyHeadJointPos = head.GetWorldCenter();
            bodyHeadJointPos.y += 4 / Config.physScale;
            bodyHeadJoint.Initialize(body, head, bodyHeadJointPos);
            bodyHeadJoint.lowerAngle = Util.degToRad(-45);//  (-90 degrees)
            bodyHeadJoint.upperAngle = Util.degToRad(45);// (45 degrees)
            bodyHeadJoint.enableLimit = true;
            this.world.CreateJoint(bodyHeadJoint);
        }

        // prelegL
        var pLegL = addBodyPart({x:x / Config.physScale, y:(y + 2) / Config.physScale});
        if (!jointData.pLegLJointOff) {
            if (faceRight) addJoint(body, pLegL, true, Util.degToRad(-90), Util.degToRad(60));
            else addJoint(body, pLegL, true, Util.degToRad(-60), Util.degToRad(90));
        }

        // legL
        var legL = addBodyPart({x:x / Config.physScale, y:(y + 7) / Config.physScale});
        if (!jointData.legLJointOff) {
            if (faceRight) addJoint(pLegL, legL, true, Util.degToRad(-20), Util.degToRad(90));
            else addJoint(pLegL, legL, true, Util.degToRad(-90), Util.degToRad(20));
        }

        // prelegR
        var pLegR = addBodyPart({x:x / Config.physScale, y:(y + 2) / Config.physScale});
        if (!jointData.pLegRJointOff) {
            if (faceRight) addJoint(body, pLegR, true, Util.degToRad(-90), Util.degToRad(60));
            else addJoint(body, pLegR, true, Util.degToRad(-60), Util.degToRad(90));
        }

        // legR
        var legR = addBodyPart({x:x / Config.physScale, y:(y + 7) / Config.physScale});
        if (!jointData.legRJointOff) {
            if (faceRight) addJoint(pLegR, legR, true, Util.degToRad(-20), Util.degToRad(90));
            else addJoint(pLegR, legR, true, Util.degToRad(-90), Util.degToRad(20));
        }

        // pHandL
        var pHandL = addBodyPart({x:x / Config.physScale, y:(y - 4) / Config.physScale});
        if (!jointData.pHandLJointOff) {
            addJoint(body, pHandL, false);
        }

        // handL
        var handL = addBodyPart({x:x / Config.physScale, y:(y + 1) / Config.physScale});
        if (!jointData.handLJointOff) {
            addJoint(pHandL, handL, true, Util.degToRad(-90), Util.degToRad(90));
        }

        // pHandR
        var pHandR = addBodyPart({x:x / Config.physScale, y:(y - 4) / Config.physScale});
        if (!jointData.pHandRJointOff) {
            addJoint(body, pHandR, false);
        }

        // handL
        var handR = addBodyPart({x:x / Config.physScale, y:(y + 1) / Config.physScale});
        if (!jointData.handRJointOff) {
            addJoint(pHandR, handR, true, Util.degToRad(-90), Util.degToRad(90));
        }

        var bodyData = {
            body:body,
            head:head,
            pLegL:pLegL,
            pLegR:pLegR,
            legL:legL,
            legR:legR,
            pHandL:pHandL,
            pHandR:pHandR,
            handL:handL,
            handR:handR
        };
        for (var key in pose) {
            bodyData[key].SetAngle(Util.degToRad(pose[key]));
        }
        //pHandR.SetAngle(Util.degToRad(90));
        //handR.SetAngle(Util.degToRad(90));
        //this.setImpulseY(head, -55);
        //this.addImpulse(head, 2, 0);
        //this.setImpulseY(body, 5);

        return bodyData;
    };

    Physics.prototype.setVelocityX = function (body, x, translate) {
        body.SetAwake(true);
        var cV = body.GetLinearVelocity();
        var dV = new this.b2Vec2(x, cV.y);
        if (translate) dV.x /= Config.physScale;
        body.SetLinearVelocity(dV);
    };

    Physics.prototype.setVelocityY = function (body, y, translate) {
        body.SetAwake(true);
        var cV = body.GetLinearVelocity();
        var dV = new this.b2Vec2(cV.x, y);
        if (translate) dV.y /= Config.physScale;
        body.SetLinearVelocity(dV);
    };

    Physics.prototype.setImpulseX = function (body, x) {
        body.SetAwake(true);

        var vel = body.GetLinearVelocity();
        var velChangeX = x - vel.x;
        var impulseX = body.GetMass() * velChangeX; //disregard time factor
        body.ApplyImpulse(new this.b2Vec2(impulseX, 0), body.GetWorldCenter());
    };

    Physics.prototype.setImpulseY = function (body, y) {
        body.SetAwake(true);

        var vel = body.GetLinearVelocity();
        var velChange = y - vel.y;
        var impulse = body.GetMass() * velChange; //disregard time factor
        body.ApplyImpulse(new this.b2Vec2(0, impulse), body.GetWorldCenter());
    };

    Physics.prototype.addImpulse = function (body, x, y) {
        body.SetAwake(true);
        var impulseX = body.GetMass() * x; //disregard time factor
        var impulseY = body.GetMass() * y; //disregard time factor
        body.ApplyImpulse(new this.b2Vec2(impulseX, impulseY), body.GetWorldCenter());
    };

    Physics.prototype.setVelocity = function (body, x, y, translate) {
        body.SetAwake(true);
        var dV = new this.b2Vec2(x, y);
        if (translate) {
            dV.x /= Config.physScale;
            dV.y /= Config.physScale;
        }
        body.SetLinearVelocity(dV);
    };

    Physics.prototype.addRagDollImpulse = function (bodyData, impulseData, velocityData) {
        for (var key in bodyData) {
            bodyData[key].SetLinearVelocity(velocityData);
            bodyData[key].ApplyImpulse(new this.b2Vec2(Math.cos(impulseData.angle) * impulseData.force, Math.sin(impulseData.angle) * impulseData.force), bodyData[key].GetPosition());
        }
    };

    Physics.prototype.setRagDollVelocity = function (bodyData, velocityData) {
        for (var key in bodyData) {
            bodyData[key].SetLinearVelocity(velocityData);
        }
    };

    Physics.prototype.setFriction = function (body, friction) {
        //body.SetAwake(false);
        body.GetFixtureList().SetFriction(friction);
    };

    Physics.prototype.getBodyRealPosition = function (body) {
        return {x:body.GetPosition().x * Config.physScale, y:body.GetPosition().y * Config.physScale};
    };

    Physics.prototype.getBodyRotation = function (body) {
        return body.GetAngle();
    };

    Physics.prototype.addStatic = function (data) {
        var fixDef = new this.b2FixtureDef;
        fixDef.density = 1.0;
        fixDef.friction = 0.5;
        fixDef.restitution = 0.0;
        fixDef.filter.categoryBits = CollisionGroups.common.categoryBits;
        fixDef.filter.maskBits = CollisionGroups.common.mask;

        var bodyDef = new this.b2BodyDef;
        bodyDef.userData = {
            type:"ground"
        };

        //create ground
        bodyDef.type = this.b2Body.b2_staticBody;
        bodyDef.position.x = 0;
        bodyDef.position.y = 0;
        fixDef.shape = new this.b2PolygonShape;
        for (var i = 0; i < data.length; i++) {
            if (data[i].type != "polygon" || data[i].plots.length == 0) continue;
            var center = Util.getCenterPoint(data[i].plots);
            if (Util.less(data[i].plots[0],data[i].plots[1],center)) data[i].plots.reverse();
            var scaledObject = [];
            for (var j = 0; j < data[i].plots.length; j++) {
                scaledObject.push(new this.b2Vec2(data[i].plots[j].x / Config.physScale, data[i].plots[j].y / Config.physScale));
            }
            fixDef.shape.SetAsArray(scaledObject, data[i].plots.length);
            this.world.CreateBody(bodyDef).CreateFixture(fixDef);
        }

        // dpolys
        var fixDef = new this.b2FixtureDef;
        fixDef.density = 1.0;
        fixDef.friction = 0.5;
        fixDef.restitution = 0.0;
        fixDef.filter.categoryBits = CollisionGroups.background.categoryBits;
        fixDef.filter.maskBits = CollisionGroups.background.mask;
        fixDef.filter.groupIndex = -1;

        var bodyDef = new this.b2BodyDef;
        bodyDef.userData = {
            type:"ground"
        };

        //create ground
        bodyDef.type = this.b2Body.b2_staticBody;
        bodyDef.position.x = 0;
        bodyDef.position.y = 0;
        fixDef.shape = new this.b2PolygonShape;
        for (var i = 0; i < data.length; i++) {
            if (data[i].type != "dpolygon" || data[i].plots.length == 0) continue;
            var center = Util.getCenterPoint(data[i].plots);
            if (Util.less(data[i].plots[0],data[i].plots[1],center)) data[i].plots.reverse();
            var scaledObject = [];
            for (var j = 0; j < data[i].plots.length; j++) {
                scaledObject.push(new this.b2Vec2(data[i].plots[j].x / Config.physScale, data[i].plots[j].y / Config.physScale));
            }
            fixDef.shape.SetAsArray(scaledObject, data[i].plots.length);
            this.world.CreateBody(bodyDef).CreateFixture(fixDef);
        }

        // floor
        var fixDef = new this.b2FixtureDef;
        fixDef.density = 1.0;
        fixDef.friction = 0.5;
        fixDef.restitution = 0.0;
        fixDef.filter.categoryBits = CollisionGroups.common.categoryBits;
        fixDef.filter.maskBits = CollisionGroups.common.mask;
        //fixDef.filter.groupIndex = -1;

        var bodyDef = new this.b2BodyDef;
        bodyDef.userData = {
            type:"floor"
        };

        //create ground
        bodyDef.type = this.b2Body.b2_staticBody;
        bodyDef.position.x = 0;
        bodyDef.position.y = 0;
        fixDef.shape = new this.b2PolygonShape;
        for (var i = 0; i < data.length; i++) {
            if (data[i].type != "fpolygon" || data[i].plots.length == 0) continue;
            var middlePoint = Util.getCenterPoint(data[i].plots);
            if (Util.less(data[i].plots[0],data[i].plots[1],middlePoint)) data[i].plots.reverse();
            var scaledObject = [];
            for (var j = 0; j < data[i].plots.length; j++) {
                scaledObject.push(new this.b2Vec2((data[i].plots[j].x-middlePoint.x) / Config.physScale, (data[i].plots[j].y-middlePoint.y) / Config.physScale));
            }
            bodyDef.position.x = middlePoint.x / Config.physScale;
            bodyDef.position.y = middlePoint.y / Config.physScale;

            fixDef.shape.SetAsArray(scaledObject, data[i].plots.length);
            this.world.CreateBody(bodyDef).CreateFixture(fixDef);
        }
    };

    Physics.prototype.addCircleObject = function (id, x, y, radius, isBullet, isUsual) {
        var group = (isUsual || isUsual == undefined) ? CollisionGroups.common : CollisionGroups.background;
        var fixDef = new this.b2FixtureDef;
        fixDef.density = 1.0;
        fixDef.friction = 0.5;
        fixDef.restitution = 0.2;
        fixDef.filter.categoryBits = group.categoryBits;
        fixDef.filter.maskBits = group.mask;

        var bodyDef = new this.b2BodyDef;
        bodyDef.userData = {
            id:id,
            type:"object"
        };
        bodyDef.bullet = isBullet;

        //create some objects
        bodyDef.type = this.b2Body.b2_dynamicBody;
        fixDef.shape = new this.b2CircleShape(radius / Config.physScale);
        bodyDef.position.x = x / Config.physScale;
        bodyDef.position.y = y / Config.physScale;
        var body = this.world.CreateBody(bodyDef);
        body.CreateFixture(fixDef);
        return body;
    };

    Physics.prototype.addBoxObject = function (id, x, y, size, isBullet, isUsual, additionalInfo) {
        var group = (isUsual || isUsual == undefined) ? CollisionGroups.common : CollisionGroups.background;
        var fixDef = new this.b2FixtureDef;
        fixDef.density = 1.0;
        fixDef.friction = 0.5;
        fixDef.restitution = 0.3;
        fixDef.filter.categoryBits = group.categoryBits;
        fixDef.filter.maskBits = group.mask;

        var bodyDef = new this.b2BodyDef;
        bodyDef.userData = {
            id:id,
            type:"object",
            additionalInfo: additionalInfo
        };
        bodyDef.bullet = isBullet;

        //create some objects
        bodyDef.type = this.b2Body.b2_dynamicBody;
        fixDef.shape = new this.b2PolygonShape;

        fixDef.shape.SetAsBox(
            size / Config.physScale, //half width
            size / Config.physScale //half height
        );
        bodyDef.position.x = x / Config.physScale;
        bodyDef.position.y = y / Config.physScale;
        var body = this.world.CreateBody(bodyDef);
        body.CreateFixture(fixDef);
        return body;
    };

    Physics.prototype.raycast = function (from, to, ignoredBodyType) {
        var input = new Box2D.Collision.b2RayCastInput;
        var output = new Box2D.Collision.b2RayCastOutput;
        input.p1 = {x:from.x / Config.physScale, y:from.y / Config.physScale};
        input.p2 = {x:to.x / Config.physScale, y:to.y / Config.physScale};
        input.maxFraction = 1;

        var closestFraction = 1;

        var b;
        var f = new this.b2FixtureDef();
        var intersectionNormal = new this.b2Vec2(0, 0);
        var intersectionPoint = new this.b2Vec2();
        var bodyData = "";
        var found = false;

        for (b = this.world.GetBodyList(); b; b = b.GetNext()) {
            if (!b.IsActive()) continue;
            if (!b.GetUserData() || ignoredBodyType.indexOf(b.GetUserData().type) < 0) {
                for (f = b.GetFixtureList(); f; f = f.GetNext()) {
                    if (!f.RayCast(output, input)) {
                        // do nothing.. probably
                    } else if (output.fraction < closestFraction) {
                        found = true;
                        closestFraction = output.fraction;
                        intersectionNormal = output.normal;
                        bodyData = b.GetUserData();
                    }
                }
            }
        }
        intersectionPoint.x = input.p1.x + closestFraction * (input.p2.x - input.p1.x);
        intersectionPoint.y = input.p1.y + closestFraction * (input.p2.y - input.p1.y);

        return (found) ? {body:bodyData, point:{x:intersectionPoint.x * Config.physScale, y:intersectionPoint.y * Config.physScale}, normal:intersectionNormal} : null;
    };

    Physics.prototype.explode = function (x, y, radius, power, isImplosion) {
        var b2TouchPosition = new this.b2Vec2(x / Config.physScale, y / Config.physScale);
        var maxDistance = radius / Config.physScale;
        var listOfTouchedBodies = [];
        for (var body = this.world.GetBodyList(); body; body = body.GetNext()) {
            if (!body.IsActive()) continue;
            var b2BodyPosition = body.GetPosition();
            var distance;
            var strength;
            var force;
            var angle;

            if (isImplosion) { // To go towards the press, all we really change is the atan function, and swap which goes first to reverse the angle
                // Get the distance, and cap it
                distance = Util.distance(b2BodyPosition, b2TouchPosition);
                // Get the strength
                strength = (maxDistance - distance) / maxDistance; // This makes it so that the closer something is - the stronger, instead of further
                if (distance > maxDistance) continue;
                force = strength * power;

                // Get the angle
                angle = Math.atan2(b2TouchPosition.y - b2BodyPosition.y, b2TouchPosition.x - b2BodyPosition.x);
            } else {
                distance = Util.distance(b2BodyPosition, b2TouchPosition);
                strength = (maxDistance - distance) / maxDistance; // This makes it so that the closer something is - the stronger, instead of further
                if (distance > maxDistance) continue;

                force = strength * power;
                angle = Math.atan2(b2BodyPosition.y - b2TouchPosition.y, b2BodyPosition.x - b2TouchPosition.x);
            }
            var bodyData = body.GetUserData();
            if (!bodyData) continue;
            if (bodyData.type && (bodyData.type == "gib" || bodyData.type == "object")) {
                body.ApplyImpulse(new this.b2Vec2(Math.cos(angle) * force, Math.sin(angle) * force), body.GetPosition());
            } else if (bodyData.type && bodyData.type != "static") {
                listOfTouchedBodies.push({data:bodyData, angle:angle, force:force});
            }
        }

        return  _.uniq(listOfTouchedBodies, function (obj) {
            return obj.data.id;
        });
    };

    Physics.prototype.removeBody = function (body) {
        this.world.DestroyBody(body);
    };

    Physics.prototype.update = function (dt, renderer) {
        this.world.Step(
            dt   //frame-rate
            , 10       //velocity iterations
            , 10       //position iterations
        );
        /*if (this.debugging) {
            this.world.m_debugDraw.GetSprite().save();
            this.world.m_debugDraw.GetSprite().translate(renderer.ox,renderer.oy);
            this.world.DrawDebugData();
            this.world.m_debugDraw.GetSprite().restore();
        }*/
        this.world.ClearForces();
    };
    return new Physics();
});