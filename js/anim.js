/*
 *  Dead souls project
 *
 *  Created by Vitaly Lyapin.
 *  License: CC BY-NC-SA 3.0
 */
define(['js/img.loader'], function(ImgManager){
	var Anim = function(atlas, filePrefix, postfix, from, to, speed, continuous){
		this.atlas = atlas;
		this.speed = speed;
		this.filePrefix = filePrefix;
		this.postfix = postfix;
		this.from = from;
		this.to = to;
		this.framesTotal = to - from;
		this.currentFrame = 0;
		this.continuous = continuous;
	};

	Anim.prototype.update = function(delta) {
		this.currentFrame += (delta * this.speed);
		if (this.continuous) {
			this.currentFrame = (this.currentFrame+this.framesTotal) % this.framesTotal;
		} else if (this.currentFrame > this.framesTotal) {
			return false;
		}
		return true;
	};
	
	Anim.prototype.getFrame = function() {
		return ImgManager.getImage(this.atlas, this.filePrefix + (~~this.currentFrame+this.from) + this.postfix);
	};
	return Anim;
});