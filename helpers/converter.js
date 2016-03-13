'use strict';

const Converter       = require('app-core/helpers/converter.js');
const markdownBemjson = require('markdown-bemjson')();
const string          = require('underscore.string');

// TODO
const bundleDir = '/Users/lipolyakov/development/projects/trusha/application/bem/bundles/index';
const bemhtml = require(bundleDir + '/index.bemhtml.final.js').BEMHTML;

module.exports = class extends Converter {

    bemjsonToHtml(bemjson) {
        return bemhtml.apply(bemjson)
    }

    bemjsonToText(bemjson, length, pruneString) {
        const html = this.bemjsonToHtml(bemjson);
        let result = string.stripTags(html);

        // Add space after punctuation
        result = result.replace(/[а-яa-z0-9]([\.,!:;])/gi, '$1 ');

        string.clean(result);

        if (length) {
            result = string.prune(result, length, pruneString || '&hellip;');
        }

        return result;
    }
};
