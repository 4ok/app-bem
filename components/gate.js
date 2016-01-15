'use strict';

var q       = require('q');
var logger  = require('logger')();

module.exports = class {

    constructor(http) {
        this._http = http;
    }

    callMethod() {
        var result;

        if (typeof arguments[0] == 'object') {
            var methods  = arguments[0];
            var promises = [];
            var equals   = [];

            Object
                .keys(methods)
                .forEach(function (key, i) {
                    var method  = methods[key];
                    var promise = this._callOneMethod(method.name, method.args);
                    equals[i]   = key;

                    promises.push(promise);
                }
                .bind(this));

            result = q
                .all(promises)
                .then(function (data) {
                    var result = {};

                    data.forEach(function (item, i) {
                        result[equals[i]] = item;
                    });

                    return result;
                })
                .fail(this._onPromiseFail);
        } else {
            var name = arguments[0];
            var args = arguments[1];

            result = this
                ._callOneMethod(name, args)
                .fail(this._onPromiseFail);
        }

        return result;
    }

    _callOneMethod(name, data) {
        var params = name.split('/');

        var controllerName  = params[0];
        var actionName      = params[1] || 'index';
        var controllersPath = 'app-api/methods/' + controllerName;
        var Controller      = require(controllersPath);
        var controller      = new Controller(this._http);

        return controller[actionName + 'Action'](data || {});
    }

    _onPromiseFail(err) {
        var message = (err.getMessage)
            ? err.getMessage()
            : (err.stack || err);

        logger.error(message);
    }
};
