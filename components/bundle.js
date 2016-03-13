'use strict';

const fs  = require('fs');
const vm  = require('vm');
const vow = require('vow');
const enb = require('enb');

class Bundle {

    constructor(options) {
        this._bemtreeContext = {
            console : console, // TODO: if dev
            Vow     : vow
        };

        if (undefined !== options.root) {

            if (!fs.existsSync(options.root)) {
                throw new Error('Root dir "' + options.root + '" is not exists');
            }

            let level = 'bundles';

            if (options.level) {
                level = options.level + '.' + level;
            }

            if (undefined !== options.bundle) {
                const pathProlog = [
                    options.root,
                    level,
                    options.bundle,
                    options.bundle
                ].join('/');

                this._bemhtmlPath = pathProlog + '.bemhtml.final.js'; // TODO
                this._bemtreePath = pathProlog + '.bemtree.final.js'; // TODO
            }
        }

        if (undefined === options.cache) {
            options.cache = true;
        }
    }

    static make() {
        const bundle = new Bundle({
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

        return this
            .getBemtree()
            .apply(data)
            .then((bemjson) => {
                let content;

                switch (output) {
                    case 'bemjson' : {
                        content = '<pre>' + JSON.stringify(bemjson, null, 4) + '</pre>';
                        break;
                    }
                    default: {
                        content = this.getBemhtml().apply(bemjson);
                    }
                }

                return content;
            });
    }

    addBemtreeContext(context) {

        for (let key in context) {
            this._bemtreeContext[key] = context[key];
        }
    }

    getBemtree() {

        if (!this._bemtree) {
            const content = fs.readFileSync(this._bemtreePath, 'utf-8');
            const context = this._bemtreeContext;

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
