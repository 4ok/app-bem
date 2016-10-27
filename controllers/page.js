const fs = require('fs');
const logger = require('logger')();
const config = require('config');
const Bundle = require('../components/bundle');
const Gate = require('app-gate');
const HelperFactory = require('app-core/components/helper/factory');
const Controller = require('app-core/components/controller');

const LOGGER_PROFILE_SEND_RESPONSE = 'Send response';

module.exports = class extends Controller {

    constructor(http, gateMethodsDir) {
        super(http);

        this._helperFactory = new HelperFactory(http, [
            __dirname + '/../helpers',
            'app-core/helpers',
        ]);
        this._gate = new Gate();
        this._gateMethodsDir = gateMethodsDir;
    }

    indexAction() {
        logger.profile(LOGGER_PROFILE_SEND_RESPONSE);

        const routeName = this._request.getParam('route').name;
        let result;

        // TODO
        switch (routeName) {
            case 'article' : {
                const articleAliasChain = this._param.route('article_alias_chain');

                // TODO: delete if
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
            case 'catalog-category' : {
                result = this._setRequestParamByGateResult(
                    'route.params.category_id', // TODO
                    '_id',
                    'data:catalog',
                    {
                        filter : {
                            parent_id: null,
                            alias : this._param.route('category_alias')
                        },
                    }
                );
                break;
            }
            case 'catalog-product' : {
                const all = [
                    this._setRequestParamByGateResult(
                        'route.params.category_id', // TODO
                        '_id',
                        'data:catalog',
                        {
                            filter : {
                                parent_id: null,
                                alias : this._param.route('category_alias')
                            },
                        }
                    ),
                    this._setRequestParamByGateResult(
                        'route.params.subcategory_id',
                        '_id',
                        'data:catalog',
                        {
                            filter : {
                                parent_id: {
                                    $exists : true,
                                },
                                alias : this._param.route('subcategory_alias')
                            },
                        }
                    ),
                ];

                if (this._param.route('product_alias')) {
                    all.push(this._setRequestParamByGateResult(
                        'route.params.product_id',
                        '_id',
                        'data:catalog',
                        {
                            filter : {
                                alias : this._param.route('product_alias')
                            },
                        }
                    ));
                } else {
                    all.push(this._setRequestParamByGateResult(
                        'route.params.product_id',
                        '_id',
                        'data:catalog',
                        {
                            filter : {
                                '#parent' : {
                                    alias : this._param.route('subcategory_alias'),
                                },
                            },
                        }
                    ));
                }

                result = Promise.all(all);
                break;
            }
            default: {
                result = Promise.resolve();
            }
        }

        result
            .then(this._logRequestParams.bind(this))
            .then(this._showPage.bind(this))
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
        return this._getBundleData()
            .then(data => {
                data = data || {};

                return this._render('index', { // TODO index
                    block : 'index',
                    bemtree : {
                        helper : this._helperFactory.getHelper.bind(this._helperFactory),
                        data,
                    },
                    context : this._param.route('context'),
                })
            });
    }

    _getBundleData() {
        const methods = this._getPageGateMethods();

        return methods
            ? this._gate.callMethod(methods)
            : Promise.resolve();
    }

    _getPageGateMethods() {
        const pageAlias = this._param.route('page_alias');
        const methodsPaths = [
            this._gateMethodsDir + '/' + pageAlias + '.js',
            this._gateMethodsDir + '/common.js'
        ];

        return methodsPaths.reduce((result, methodsPath) => {

            if (fs.existsSync(methodsPath)) {
                const methods = require(methodsPath); // TODO: cache
                Object.assign(result, methods(this));
            }

            return result;
        }, {});
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
