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
                } else {
                    result = Promise.resolve();
                }
                break;
            }
            case 'catalog-category' : { // TODO
                const callMethod = this._gate.callMethod.bind(this._gate);

                result = callMethod('data:catalog/list', { // TODO: list it is for get children
                    filter : {
                        parent_id: null,
                        alias : this._param.route('category_alias')
                    },
                    limit : 1
                })
                .then(categories => {
                    const category = categories[0];
                    let result;

                    this._request.setParam('route.params.category_id', category._id); // TODO: no route

                    if (category.num.children > 1) {
                        result = Promise.reject(); // TODO
                    } else {
                        result = callMethod('data:catalog', {
                            filter : {
                                parent_id: category._id,
                            },
                        });
                    }

                    return result;
                })
                .then(subcategory => {
                    this._request.setParam('route.params.subcategory_id', subcategory._id);
                })
                .catch(function () {
                    console.info('In this category is more than one a subcategory'); // TODO
                });
                break;
            }
            case 'catalog-product' : {
                const callMethod = this._gate.callMethod.bind(this._gate);

                result = callMethod('data:catalog', {
                    filter : {
                        parent_id: null,
                        alias : this._param.route('category_alias'),
                    },
                })
                .then(category => {
                    this._request.setParam('route.params.category_id', category._id); // TODO: no route

                    return callMethod('data:catalog', {
                        filter : {
                            parent_id: category._id,
                            alias : this._param.route('subcategory_alias'),
                        },
                    });
                })
                .then(subcategory => {
                    this._request.setParam('route.params.subcategory_id', subcategory._id); // TODO: no route

                    if (this._param.route('product_alias')) {
                        return callMethod('data:catalog', {
                            filter : {
                                parent_id : subcategory._id,
                                alias : this._param.route('product_alias')
                            }
                        });
                    } else {
                        return callMethod('data:catalog', {
                            filter : {
                                parent_id : subcategory._id,
                            },
                            sort : {
                                sort : 1
                            }
                        });
                    }
                })
                .then(product => {
                    this._request.setParam('route.params.product_id', product._id);
                });
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
        const methods = this._getPageGateMethods(); // todo: move to construct?
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

                            throw new BreakPromise(
                                `The mandatory method "${methodAlias}" returned "undefined". Response code 404.`,
                                'warn'
                            );
                        }
                    });

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
        const pageAlias = this._param.route('pageAlias'); // todo
        const methodsPaths = [
            this._gateMethodsDir + '/' + pageAlias + '.js',
            this._gateMethodsDir + '/common.js' // TODO: common rename
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
