'use strict';

const fs = require('fs');
const vm = require('vm');
const Vow = require('vow');
const enb = require('enb');

module.exports = class {

    constructor(options) {
        this._bemtreeContext = {
            console,
            global,
            require,
            Vow,
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
                    options.bundle,
                ].join('/');

                this._bemhtmlPath = pathProlog + '.bemhtml.final.js'; // TODO
                this._bemtreePath = pathProlog + '.bemtree.final.js'; // TODO
                this._gateMethodPath = pathProlog + '.gate.final.js'; // TODO
            }
        }

        if (undefined === options.cache) {
            options.cache = true;
        }
    }

    make() {
        return enb.make();
    }

    render(data, output) {
        const bemjson = this
            .getBemtree()
            .apply(data);

        let content;

        switch (output) {
            case 'bemjson' : {
                content = [
                    '<pre>',
                    JSON.stringify(bemjson, null, 4),
                    '</pre>',
                ].join('\n');

                break;
            }
            default: {
                content = this
                    .getBemhtml()
                    .apply(bemjson);
            }
        }

        return content;
    }

    addBemtreeContext(context) {

        Object
            .keys(context)
            .forEach(key => {
                this._bemtreeContext[key] = context[key];
            });
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

    getGateMethod() {

        if (!this._gateMethod) {
            this._gateMethod = require(this._gateMethodPath);
        }

        return this._gateMethod;
    }
};
