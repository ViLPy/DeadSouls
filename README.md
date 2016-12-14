Dead souls
==========

About
-----
an HTML5 based monochrome side-scroller shooting game with Box2D support and with elements of touch typing learning program.
This game made specially for Udacity CS255 Game Development Contest.

**Best to be played in latest Google Chrome**
Unfortunately because this game use physics intensively (raycasting, ragdoll, etc.), other browsers may have problems with performance.
Safari may fail for unknown reason, sorry :)

Currently game has next modes:

 - Typing game - touch typing *learning* program. Game ends when city population became zero (or in other words when ten enemies pass the city border).
 - Battle arena - CTF champ between two commands. Never ends at that moment. Bullets are not infinite. Feel free to use rocket jumps.

Controls
--------
Battle Arena mode:

- ASD - movement left-down-right
- Shift - run mode
- Space - jump
- Ctrl - crouch, you cannot move in while crouching
- 1-4 - weapon choose
- Q - aim mode, helpfull for long-distance shooting
- W - command for friendly units to attack enemy base

Typing game mode:

- Enter - grenade launcher, can be helpfull sometimes

Third-party components:
-----------------------
Libraries:

 - [RequireJS](http://requirejs.org/) - a JavaScript file and module loader
 - [Lodash](http://lodash.com/) - low-level utility library
 - [Box2DWeb](https://code.google.com/p/box2dweb/) -  port of Box2DFlash 2.1a to JavaScript
 - [microajax](http://code.google.com/p/microajax/) - small and easy to use AJAX library
 - [Dijkstra](https://github.com/andrewhayward/dijkstra) - path-finding library

Font: [MSU1](http://www.dafont.com/msu1.font?fpp=50)

Sounds (CC0/CC3 licenses, just check the links below):

 - [Pistol](http://soundbible.com/1906-Barreta-M9.html)
 - [Riffle shot](http://soundbible.com/1547-M1-Garand-Single.html)
 - [Sniper](http://www.freesound.org/people/SoundCollectah/sounds/157801/)
 - [Shotgun](http://soundbible.com/1960-Shotgun-Old-School.html)
 - [Grenade launcher](http://www.freesound.org/people/LeMudCrab/sounds/163458/)
 - [Explosion](http://soundbible.com/538-Blast.html)
 - [Menu](http://www.freesound.org/people/broumbroum/sounds/50561/)

*Other source code and media Licensed under a Creative Commons CC BY-NC-SA License*
