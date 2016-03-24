'use strict';

const Helper          = require('app-core/components/helper/abstract');
const string          = require('underscore.string');
const markdownBemjson = require('markdown-bemjson')();
const crypto          = require('crypto');

// TODO
const bundleDir = '/Users/lipolyakov/development/projects/trusha/application/bem/bundles/index';
const bemhtml = require(bundleDir + '/index.bemhtml.final.js').BEMHTML;

module.exports = class extends Helper {

    constructor(http) {
        super(http);
        this._cache = {};
    }

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

    markdownToBemjson(markdown) {
        return markdownBemjson.convert(markdown);
    }

    markdownToText(markdown, length) {
        const hash = this._getMethodParamsHash('markdownToText', arguments);

        if (!this._cache[hash]) {
            const bemjson = this.markdownToBemjson(markdown);

            this._cache[hash] = this.bemjsonToText(bemjson, length);
        }

        return this._cache[hash];
    }

    _getMethodParamsHash(method, args) {
        const params = Array.prototype.join.call(args, '|');
        const str    = params
            .map(param => (typeof param == 'object')
                ? JSON.parse(param)
                : param
            )
            .concat(method)
            .join('~');

        return crypto
            .createHash('sha256')
            .update(str)
            .digest('hex');
    }
};
