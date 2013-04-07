/*
 *  Dead souls project
 *
 *  Created by Vitaly Lyapin.
 *  License: CC BY-NC-SA 3.0
 */
require.config({
	paths: {
		jquery: 'lib/jquery.min',
		underscore: 'lib/lodash.min'
	},
    shim: {
    	underscore: {
			exports: "_"
	    }
    }

    
});

require(['jquery', 'js/game.app'], function($, App){
	new App('foo', 'bar');
});