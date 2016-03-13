'use strict';

const fs            = require('fs');
const logger        = require('logger')();
const BreakPromise  = require('break-promise');
const config        = require('config');
const Bundle        = require('../components/bundle');
const Gate          = require('app-gate');
const HelperFactory = require('app-core/components/helper/factory');
const Controller    = require('controller-abstract');

const LOGGER_PROFILE_SEND_RESPONSE = 'Send response';

module.exports = class extends Controller {

    constructor(http) {
        super(http);

        this._helperFactory = new HelperFactory(http, [
            __dirname + '/../helpers',
            'app-core/helpers'
        ]);
        this._gate = new Gate();
    }

    indexAction() {
        logger.profile(LOGGER_PROFILE_SEND_RESPONSE);

        // TODO
        if (this._params.route('article_alias_chain')) {
            this._aaa()
                .then(this._findPage.bind(this))
                .then(this._showPage.bind(this))
                .fail(this._onError.bind(this))
                .done();
        } else {
            this._findPage()
                .then(this._showPage.bind(this))
                .fail(this._onError.bind(this))
                .done();
        }
    }

    _aaa() { // TODO
        const articleAliasChain  = this._params.route('article_alias_chain');

        return this._gate
            .callMethod('base:article', {
                filter : {
                    alias : {
                        '#chain' : articleAliasChain
                    }
                }
            })
            .then(page => this._request.setParam('article_id', page._id));
    }

    _findPage() {

        return this._gate
            .callMethod('base:page', {
                filter: {
                    alias : this._params.route('page_alias')
                }
            })
            .then(page => {

                if (!page) {
                    this._response.send404('Page not found');

                    throw new BreakPromise('Page not found', 'warn');
                }

                return page;
            });
    }

    _showPage(page) {

        return this._bundleApplyData('index', { // TODO index
            block   : 'index',
            helper  : this._helperFactory.getHelper.bind(this._helperFactory),
            context : {
                block : 'page', // TODO
                //mods  : {
                //    sidebar : true
                //},
                content : page.content,
                seo     : page.seo
            }
        });
    }

    _bundleApplyData(bundleName, bundleData) { // TODO
        const output = this._params.query('__output', 'html');
        const bundle = new Bundle({
            root   : config.rootPath + '/bem', // TODO
            bundle : bundleName
        });

        return bundle
            .applyData(bundleData, output)
            .then(this._sendHtmlResponse.bind(this));
    }

    _sendHtmlResponse(content) {
        logger.profile(LOGGER_PROFILE_SEND_RESPONSE);

        this._response
            .setHeader({
                'Content-Type': 'text/html; charset=utf-8'
            })
            .send(content);
    }
};
