/*
 *  Dead souls project
 *
 *  Created by Vitaly Lyapin.
 *  License: CC BY-NC-SA 3.0
 */
define(['js/physics'], function(Physics){
	var RagDollRender = function(doll, gfx, facedRight) {
		this.doll = doll;
		this.gfx = gfx;
		this.alpha = 2.4;
		this.canBeRemoved = false;
		this.facedRight = facedRight;
	};

	RagDollRender.prototype.update = function(delta) {
		this.alpha -= delta * 0.6;
		if (this.alpha <= 0) {
			for (var key in this.doll) {
				Physics.removeBody(this.doll[key]);
			}
			this.canBeRemoved = true;
		}
	};

	RagDollRender.prototype.render = function(renderer) {
		if (this.canBeRemoved) return;
		renderer.context.globalAlpha = this.alpha;
		for (var key in this.doll) {
			var position = Physics.getBodyRealPosition(this.doll[key]);
			var center = this.gfx[key].center || {x: 0, y: 0};
			var objScale = this.gfx[key].scale || {x: 1, y: 1};
			var scale = {x: objScale.x, y: objScale.y};
			if (!this.facedRight) {
				scale.x = -scale.x;
			}
			renderer.drawImageT(this.gfx[key].img, position.x, position.y, center, scale, Physics.getBodyRotation(this.doll[key]));
		}
		renderer.context.globalAlpha = 1;
	};

	return RagDollRender;
});
