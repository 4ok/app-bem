const Helper = require('app-core/components/helper/abstract');
const string = require('underscore.string');
const crypto = require('crypto');

// TODO
const bundleDir = '../../../bem/bundles/index';
const bemhtml = require(bundleDir + '/index.bemhtml.min.js').BEMHTML;

const METHODS_CACHE = {};

// TODO
const rules = {

    code(code, lang) {
        let result;

        if (lang === 'javascript') {
            result = JSON.parse(code);
        } else {
            result = {
                elem : 'code',
                content : code,
            };

            if (lang) {
                result.mods = {
                    lang : 'lang',
                };
            }
        }

        return result;
    },
};

const MarkdownBemjson = require('markdown-bemjson');
const markdownBemjson = new MarkdownBemjson({
    rules,
    wrapper: false,
});

module.exports = class extends Helper {

    bemjsonToHtml(bemjson) {
        return this._cache(
            'bemjsonToHtml',
            arguments,
            () => bemhtml.apply(bemjson)
        );
    }

    bemjsonToText(bemjson, length, pruneString) {
        return this._cache('bemjsonToText', arguments, () => {
            const html = this.bemjsonToHtml(bemjson);
            let result = string.stripTags(html);

            // Add space after punctuation
            result = result.replace(/[а-яa-z0-9]([\.,!:;])/gi, '$1 ');

            string.clean(result);

            if (length) {
                result = string.prune(result, length, pruneString || '&hellip;');
            }

            return result;
        });
    }

    markdownToBemjson(markdown) {
        return this._cache(
            'markdownToBemjson',
            arguments,
            () => markdownBemjson.convert(markdown)
        );
    }

    markdownToText(markdown, length) {
        return this._cache('markdownToText', arguments, () => {
            const bemjson = this.markdownToBemjson(markdown);

            return this.bemjsonToText(bemjson, length);
        });
    }

    _cache(name, args, fn) {
        const hash = this._getMethodHash(name, args);

        if (!METHODS_CACHE[hash]) {
            METHODS_CACHE[hash] = fn();
        }

        return METHODS_CACHE[hash];
    }

    _getMethodHash(methodName, methodArgs) {
        const argsArr = [].slice.call(methodArgs);
        const params = [methodName].concat(argsArr);
        const paramsStr = JSON.stringify(params);

        return crypto
            .createHash('sha256')
            .update(paramsStr)
            .digest('hex');
    }
};
