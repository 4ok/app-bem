'use strict';

var logger  = require('logger')();
var Gate    = require('../components/gate.js');
var Helper  = require('app-core/components/helper/abstract.js');

module.exports = class extends Helper {

    constructor(http) {
        super(http);
        this._gate = new Gate(http); // TODO
    }

    callMethod() {

        return this._gate
            .callMethod.apply(this._gate, arguments)
            .fail(function (err) {
                var message = (err.getMessage)
                    ? err.getMessage()
                    : (err.stack || err);

                logger.error(message);
            });
    }
};
