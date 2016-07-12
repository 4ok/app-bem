const fs = require('fs');
// eslint-disable-next-line import/no-unresolved
const enb = require('enb');

module.exports = class {

    constructor(options) {

        if (options.root !== undefined) {

            if (!fs.existsSync(options.root)) {
                throw new Error('Root dir "' + options.root + '" is not exists');
            }

            let level = 'bundles';

            if (options.level) {
                level = options.level + '.' + level;
            }

            if (options.bundle !== undefined) {
                const pathProlog = [
                    options.root,
                    level,
                    options.bundle,
                    options.bundle,
                ].join('/');

                this._bemhtmlPath = pathProlog + '.bemhtml.min.js'; // TODO
                this._bemtreePath = pathProlog + '.bemtree.min.js'; // TODO
                this._gateMethodPath = pathProlog + '.gate.min.js'; // TODO
            }
        }

        if (options.cache === undefined) {
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

    // TODO: get
    getBemtree() {

        if (!this._bemtree) {
            // eslint-disable-next-line global-require
            this._bemtree = require(this._bemtreePath).BEMTREE;
        }

        return this._bemtree;
    }

    // TODO: get
    getBemhtml() {

        if (!this._bemhtml) {
            // eslint-disable-next-line global-require
            this._bemhtml = require(this._bemhtmlPath).BEMHTML;
        }

        return this._bemhtml;
    }

    // TODO: get
    getGateMethod() {

        if (!this._gateMethod) {
            // eslint-disable-next-line global-require
            this._gateMethod = require(this._gateMethodPath);
        }

        return this._gateMethod;
    }
};
