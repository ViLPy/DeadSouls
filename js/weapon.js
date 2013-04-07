/*
 *  Dead souls project
 *
 *  Created by Vitaly Lyapin.
 *  License: CC BY-NC-SA 3.0
 */
define(['underscore', 'js/utils'], function (_, Util) {
    var Weapon = function (name, fireSpeed, reloadSpeed, ammoAmount, isAuto, spread, totalAmmo) {
        this.name = name;
        this.fireSpeed = fireSpeed;
        this.reloadSpeed = reloadSpeed;
        this.ammoAmount = ammoAmount;
        this.isAuto = isAuto;
        this.currentAmmo = ammoAmount;
        this.timeSinceLastShoot = fireSpeed;
        this.timeSinceReload = 0;
        this.isReloading = 0;
        this.spread = spread || 0;
        this.totalAmmo = totalAmmo;
        this.initialAmmo = totalAmmo;
    };

    Weapon.prototype.isNeedReload = function () {
        return this.currentAmmo == 0;
    };

    Weapon.prototype.canShoot = function () {
        return this.currentAmmo > 0 && ((this.timeSinceLastShoot >= this.fireSpeed && !this.isReloading) || this.reloadSpeed == 0);
    };

    Weapon.prototype.update = function (dt) {
        if (this.isReloading) {
            this.timeSinceReload += dt;
            if (this.timeSinceReload >= this.reloadSpeed) {
                this.isReloading = false;
                this.timeSinceReload = 0;
                this.timeSinceLastShoot = this.fireSpeed;
                this.currentAmmo = Math.min(this.ammoAmount, this.totalAmmo);
                this.totalAmmo -= this.currentAmmo;
            }
        } else {
            this.timeSinceLastShoot += dt;
        }
    };

    Weapon.prototype.reload = function () {
        if (this.totalAmmo > 0) {
            this.isReloading = true;
            this.timeSinceReload = 0;
        }
    };

    Weapon.prototype.reset = function() {
        this.currentAmmo = this.ammoAmount;
        this.totalAmmo = this.initialAmmo;
        this.timeSinceLastShoot = this.fireSpeed;
        this.timeSinceReload = 0;
        this.isReloading = 0;
    };

    Weapon.prototype.shoot = function () {
        this.timeSinceLastShoot = 0;
        this.currentAmmo--;
        if (this.isNeedReload()) this.reload();
    };

    Weapon.prototype.getReloadStatus = function() {
        return Math.min(this.timeSinceReload / this.reloadSpeed, 1) * 100;
    };

    return Weapon;
});
