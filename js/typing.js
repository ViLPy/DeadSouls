/*
 *  Dead souls project
 *
 *  Created by Vitaly Lyapin.
 *  License: CC BY-NC-SA 3.0
 */
define(['underscore', 'js/utils'], function (_, Util) {
    var Typing = function (dictionary) {
        this.dictionary = dictionary;
        this.currentWord = dictionary[~~(Math.random() * dictionary.length)];
        this.dictionaryHard = _.filter(dictionary, function(n) { return n.length >= 9});
        this.currentCharID = 0;
        this.homeRow = false;
        this.complete = false;

        this.totalTimeTaken = 0;
        this.totalWords = 0;
        this.startTime = null;
    };

    Typing.prototype.getHomeRowWord = function (length) {
        var homeRowArray = _.shuffle(['a', 's', 'd', 'f', 'j', 'k', 'l']);
        var result = [];
        for (var i = 0; i < length; i++) {
            result.push(homeRowArray[~~(homeRowArray.length * Math.random())]);
        }
        return result.join('');
    };

    Typing.prototype.setHomeRowMode = function (flag) {
        this.homeRow = flag;
        if (this.homeRow) {
            var length = ~~(Math.random()*5) + 4;
            this.currentWord = this.getHomeRowWord(length);
            this.currentCharID = 0;
        }
    };

    Typing.prototype.type = function (ch) {
        if (!ch) return false;
        var correct = (this.currentWord.charAt(this.currentCharID).toLowerCase() == ch.toLowerCase());
        if (this.currentCharID == 0) {
            this.startTime = new Date().getTime();
        }
        if (correct) this.currentCharID++;
        if (this.currentCharID >= this.currentWord.length) {
            this.complete = true;
            this.totalTimeTaken += (new Date().getTime() - this.startTime);
            this.totalWords++;
        }
        return correct;
    };

    // Words per minute
    Typing.prototype.getWPM = function () {
        if (this.totalWords == 0) return 0;
        var wpm = this.totalWords/(this.totalTimeTaken / (1000*60));
        return (~~(wpm*10))/10;
    };

    Typing.prototype.isComplete = function() {
        return this.complete;
    };

    Typing.prototype.getWord = function () {
        return {passed:this.currentWord.substr(0, this.currentCharID), left:this.currentWord.substr(this.currentCharID)};
    };

    Typing.prototype.getNextWord = function() {
        if (this.homeRow) {
            var length = ~~(Math.random()*5) + 4;
            this.currentWord = this.getHomeRowWord(length);
            this.currentCharID = 0;
        } else {
            this.currentWord = Util.getRandomElement(this.dictionary);
            this.currentCharID = 0;
        }
        this.complete = false;
    };

    Typing.prototype.render = function (x, y, renderer) {
        function text(str, x, y, color) {
            if (!str) return 0;
            renderer.setFillStyle(color);
            renderer.drawText(str, x, y);
            return renderer.measureText(str).width;
        }

        renderer.setFont("30px MSU1");
        var word = this.getWord();
        var middle = renderer.measureText(word.passed + word.left).width / 2;
        var deltaStr = text(word.passed, x-middle, y, "rgba(255,255,255,0.3)");
        text(word.left, x + deltaStr-middle, y, "#ffffff");
        renderer.setTextAlign();
    };

    return Typing;
});
