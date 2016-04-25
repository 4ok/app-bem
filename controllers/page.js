'use strict';

const q = require('q');
const logger = require('logger')();
const config = require('config');
const Bundle = require('../components/bundle');
const Gate = require('app-gate');
const HelperFactory = require('app-core/components/helper/factory');
const MethodContext = require('app-core/components/gate/method-context');
const Controller = require('app-core/components/controller');

const LOGGER_PROFILE_SEND_RESPONSE = 'Send response';

module.exports = class extends Controller {

    constructor(http) {
        super(http);

        this._helperFactory = new HelperFactory(http, [
            __dirname + '/../helpers',
            'app-core/helpers',
        ]);
        this._gate = new Gate();
    }

    indexAction() {
        logger.profile(LOGGER_PROFILE_SEND_RESPONSE);

        const routeName = this._request.getParam('route').name;
        let result;

        switch (routeName) {
            case 'article' : {
                const articleAliasChain = this._param.route('article_alias_chain');

                if (articleAliasChain) {
                    result = this._setRequestParamByGateResult(
                        'route.params.article_id',
                        '_id',
                        'data:article',
                        {
                            filter : {
                                alias : {
                                    '#chain' : articleAliasChain,
                                },
                            },
                        }
                    );
                }
                break;
            }
        }

        result = (result)
            ? result.then(this._logRequestParams.bind(this))
            : this._logRequestParams();

        result
            .then(this._showPage.bind(this))
            .fail(this._onError.bind(this))
            .done();
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
        return this._render('index', { // TODO index
            block : 'index',
            bemtree : {
                helper : this._helperFactory.getHelper.bind(this._helperFactory),
                data : {},
            },
            context : this._param.route('context'),
        });
    }

    _render(bundleName, bundleData) { // TODO
        const bundle = new Bundle({
            root : config.rootPath + '/bem', // TODO
            bundle : bundleName,
        });
        const context = new MethodContext(this._param);
        const methods = bundle.getGateMethod().call(context);

        const blocks = Object.keys(methods);
        const promises = blocks.map(block => this._gate.callMethod(methods[block]));

        return q
            .all(promises)
            .then(data => {
                const output = this._param.query('__output', 'html');

                blocks.forEach((block, index) => {
                    bundleData.bemtree.data[block] = data[index];
                });

                return bundle.render(bundleData, output);
            })
            .then(this._sendHtmlResponse.bind(this));
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
