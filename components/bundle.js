'use strict';

var fs       = require('fs');
var vm       = require('vm');
var vow      = require('vow');
var enb      = require('enb');
var borschik = require('borschik/js/borschik.js');

class Bundle {

    constructor(options) {
        this._bemtreeContext = {
            console  : console,
            require  : require,
            Vow      : vow,
            borschik : borschik,
            $        : {}
        };

        if (undefined !== options.root) {

            if (!fs.existsSync(options.root)) {
                throw new Error('Root dir "' + options.root + '" is not exists');
            }

            var level = 'bundles';

            if (options.level) {
                level = options.level + '.' + level;
            }

            if (undefined !== options.bundle) {
                var pathProlog = [
                    options.root,
                    level,
                    options.bundle,
                    options.bundle
                ].join('/');

                this._bemhtmlPath = pathProlog + '.bemhtml.final.js';
                this._bemtreePath = pathProlog + '.bemtree.final.js';
            }
        }

        if (undefined === options.cache) {
            options.cache = true;
        }
    }

    static make() {
        var bundle = new Bundle({
            root : config.rootPath + '/bem' // TODO
        });

        return bundle.make();
    }

    make() {

        if (!options.cache) {
            options.cache = true;
        }

        return enb.make([], {
            dir   : options.root,
            cache : options.cache
        });
    }

    applyData(data, output) {
        var self = this;

        return this
            .getBemtree()
            .apply(data)
            .then(function (bemjson) {
                var content;

                switch (output) {
                    case 'bemjson': {
                        content = '<pre>' + JSON.stringify(bemjson, null, 4) + '</pre>';
                        break;
                    }
                    case 'html':
                    default: {
                        content = self.getBemhtml().apply(bemjson);
                    }
                }

                return content;
            });
    }

    addBemtreeContext(context) {

        for (var key in context) {
            this._bemtreeContext[key] = context[key];
        }
    }

    getBemtree() {

        if (!this._bemtree) {
            var content = fs.readFileSync(this._bemtreePath, 'utf-8');
            var context = this._bemtreeContext;

            vm.runInNewContext(content, context);

            this._bemtree = context.BEMTREE;
        }

        return this._bemtree;
    }

    getBemhtml() {

        if (!this._bemhtml) {
            this._bemhtml = require(this._bemhtmlPath).BEMHTML;
        }

        return this._bemhtml;
    }
}

module.exports = Bundle;
