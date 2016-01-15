'use strict';

var Helper          = require('app-core/components/helper/abstract.js');
var markdownBemjson = require('markdown-bemjson')();

module.exports = class extends Helper {

    markdownToBemjson(markdown) {
        return markdownBemjson.convert(markdown);
    }
};
