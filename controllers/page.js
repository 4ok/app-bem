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

        // TODO
        if (this._param.route('article_alias_chain')) {
            this
                ._aaa()
                .then(this._showPage.bind(this))
                .fail(this._onError.bind(this))
                .done();
        } else {
            this
                ._showPage()
                .fail(this._onError.bind(this))
                .done();
        }
    }

    _aaa() { // TODO
        const articleAliasChain = this._param.route('article_alias_chain');

        return this._gate
            .callMethod('data:article', {
                filter : {
                    alias : {
                        '#chain' : articleAliasChain,
                    },
                },
            })
            .then(page => this._request.setParam('route.params.article_id', page._id));
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
