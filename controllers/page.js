const fs = require('fs');
const logger = require('logger')();
const config = require('config');
const Bundle = require('../components/bundle');
const Gate = require('app-gate');
const HelperFactory = require('app-core/components/helper/factory');
const Controller = require('app-core/components/controller');
const BreakPromise = require('break-promise');

const LOGGER_PROFILE_SEND_RESPONSE = 'Send response';

module.exports = class extends Controller {

    constructor(http) {
        super(http);

        logger.profile(LOGGER_PROFILE_SEND_RESPONSE);

        this._gate = new Gate();
    }

    _getProjectDirs() {
        return null;
    }

    _getHelpersDirs() {
        return [];
    }

    _getGateMethods() {
        return {};
    }

    indexAction() {
        this._logRequestParams();

        return this
            ._showPage()
            .catch(this._onError.bind(this));
    }

    _logRequestParams() {
        const request = this._request;
        const routeParamsWithoutObjectId = JSON.parse(
            JSON.stringify(request.getParam('route.params'))
        );

        logger
            .break()
            .info('Request uri: %s', request.url.path)
            .info('Route name:', request.getParam('route.name'))
            .info('Route params:', routeParamsWithoutObjectId)
            .info('Query params:', request.getParam('query') || '')
            .info('Post params:', request.getParam('body') || '');
    }

    _setRequestParamByGateResult(requestKey, resultKey, methodName, methodParams) {
        return this._gate
            .callMethod(methodName, methodParams)
            .then(result => this._request.setParam(requestKey, result[resultKey]));
    }

    _showPage() {
        const methods = this._getGateMethods(); // todo: move to construct?
        const mandatoriesMethodsAliases = Object
            .keys(methods)
            .reduce((result, key) => {
                methods[key].isMandatory && result.push(key);

                return result;
            }, []);

        return this._getBundleData()
            .then(data => {

                Object
                    .keys(data)
                    .forEach(methodAlias => {
                        const methodData = data[methodAlias];

                        if (methodData === undefined
                            && mandatoriesMethodsAliases.includes(methodAlias)
                        ) {
                            this._response.send404();
                            const message = 'The mandatory method "'
                                + methodAlias
                                + '" returned "undefined". Response code 404.';

                            throw new BreakPromise(message, 'warn');
                        }
                    });

                const helpersDirs = this._getHelpersDirs();
                const projectDir = this._getProjectDirs();
                const helperFactory = new HelperFactory(projectDir, helpersDirs, this._http, data);

                return this._render('index', { // TODO index
                    block : 'index',
                    bemtree : {
                        helper : helperFactory.getHelper.bind(helperFactory),
                        store : data,
                    },
                    context : this._param.route('context'),
                })
            });
    }

    _getBundleData() {
        const methods = this._getGateMethods();

        return methods
            ? this._gate.callMethod(methods)
            : Promise.resolve();
    }

    _render(bundleName, bundleData) { // TODO
        const bundle = new Bundle({
            root : config.rootPath + '/bem', // TODO
            bundle : bundleName,
        });
        const output = this._param.query('__output', 'html');
        const content = bundle.render(bundleData, output);

        return this._sendHtmlResponse(content);
    }

    _sendHtmlResponse(content) {
        logger.profile(LOGGER_PROFILE_SEND_RESPONSE);

        this._response
            .setHeader({
                'Content-Type' : 'text/html; charset=utf-8',
            })
            .send(content);
    }
};
