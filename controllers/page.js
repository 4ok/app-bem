const path = require('path');
const logger = require('logger')();
const Bundle = require('../components/bundle');
const Gate = require('app-gate');
const HelperFactory = require('app-core/components/helper/factory');
const Controller = require('app-core/components/controller');
const BreakPromise = require('break-promise');

const LOGGER_PROFILE_SEND_RESPONSE = 'Send response';

const DEFAULT_BEM_DIRECTORY = 'bem';
const DEFAULT_BUNDLE_NAME = 'index';
const DEFAULT_ENTRY_BLOCK = 'index';

module.exports = class extends Controller {

    constructor({
        http,
        projectDir,
        helpersDirs,
        bemDir,
        bundleName,
        entryBlock,
    }) {
        super(http);

        logger.profile(LOGGER_PROFILE_SEND_RESPONSE);

        this._projectDir = projectDir;
        this._bemDir = bemDir || path.join(this._projectDir, DEFAULT_BEM_DIRECTORY);
        this._helpersDirs = helpersDirs;
        this._bundleName = bundleName || DEFAULT_BUNDLE_NAME;
        this._entryBlock = entryBlock || DEFAULT_ENTRY_BLOCK;

        this._pageMethods = this._getPageMethods();
        this._gate = new Gate();
    }

    indexAction() {
        this._logRequestParams();

        return this
            ._showPage()
            .catch(this._onError.bind(this));
    }

    _logRequestParams() {
        const request = this._request;
        const getParam = request.getParam.bind(request);

        logger
            .break()
            .info('Request uri: %s', request.parsedUrl.path)
            .info('Route name:', getParam('route.name'))
            .info('Route params:', JSON.stringify(getParam('route.params')))
            .info('Query params:', JSON.stringify(getParam('query') || {}))
            .info('Post params:', JSON.stringify(getParam('body') || {}));
    }

    _setRequestParamByGateResult(requestKey, resultKey, methodName, methodParams) {
        return this._gate
            .callMethod(methodName, methodParams)
            .then(result => this._request.setParam(requestKey, result[resultKey]));
    }

    _showPage() {
        const methods = this._pageMethods;
        const mandatoriesMethodsAliases = Object
            .keys(methods)
            .reduce((result, key) => {

                if (methods[key].isMandatory) {
                    result.push(key);
                }

                return result;
            }, []);

        return this._getBundleData()
            .then((data) => {
                Object
                    .keys(data)
                    .forEach((methodAlias) => {
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

                // todo: spread
                /* eslint-disable comma-dangle */
                const helperFactory = new HelperFactory(
                    this._projectDir,
                    this._helpersDirs,
                    this._http,
                    data
                );
                /* eslint-disable comma-dangle */

                return this._render({
                    block: this._entryBlock,
                    bemtree: {
                        helper: helperFactory.getHelper.bind(helperFactory),
                        store: data,
                    },
                    context: this._param.route('context'),
                });
            });
    }

    _getBundleData() {
        return this._pageMethods
            ? this._gate.callMethods(this._pageMethods)
            : Promise.resolve();
    }

    _render(bundleData) {
        const bundle = new Bundle({
            root: this._bemDir,
            bundle: this._bundleName,
        });
        const output = this._param.query('__output', 'html');
        const content = bundle.render(bundleData, output);

        return this._sendHtmlResponse(content);
    }

    _sendHtmlResponse(content) {
        logger.profile(LOGGER_PROFILE_SEND_RESPONSE);

        this._response
            .setHeader({
                'Content-Type': 'text/html; charset=utf-8',
            })
            .send(content);
    }
};
