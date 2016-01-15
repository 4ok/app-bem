'use strict';

var fs            = require('fs');
var logger        = require('logger')();
var BreakPromise  = require('break-promise');
var config        = require('config');
var Bundle        = require('bem-components/bundle.js');
var Gate          = require('../components/gate.js');
var Controller    = require('controller-abstract');
var HelperFactory = require('app-core/components/helper/factory.js');

const LOGGER_PROFILE_SEND_RESPONSE = 'Send response';

module.exports = class extends Controller {

    constructor(http) {
        super(http);

        this._helperFactory = new HelperFactory(http, [
            __dirname + '/../helpers',
            'app-core/helpers'
        ]);
        this._gate = new Gate(http);
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

    _aaa() {
        var articleAliasChain  = this._params.route('article_alias_chain');

        return this._gate
            .callMethod('article', {
                filter : {
                    alias : {
                        '#chain' : articleAliasChain
                    }
                }
            })
            .then(function (page) {
                this._request.setParam('article_id', page._id);
            }.bind(this));
    }

    _findPage() {

        return this._gate
            .callMethod('page', {
                filter: {
                    alias : this._params.route('page_alias')
                }
            })
            .then(function (page) {

                if (!page) {
                    this._response().send404('Page not found');

                    throw new BreakPromise('Page not found', 'warn');
                }

                return page;
            }.bind(this));
    }

    _showPage(page) {

        return this._bundleApplyData('index', { // TODO index
            block   : 'index',
            helper  : this._helperFactory.getHelper.bind(this._helperFactory),
            context : {
                block: 'page',
                mods  : {
                    theme : 'default'
                },
                content : page.content,
                seo     : page.seo
            }
        });
    }

    _bundleApplyData(bundleName, bundleData) { // TODO
        var output = this._request.getParam('__output', 'html');

        var bundle = new Bundle({
            root   : config.rootPath + '/bem', // TODO
            bundle : bundleName
        });
        var self   = this;

        return bundle
            .applyData(bundleData, output)
            .then(function (content) {
                self._sendHtmlResponse(content);
            });
    }

    _sendHtmlResponse(content) {
        logger.profile(LOGGER_PROFILE_SEND_RESPONSE);

        this._response
            .setHeader({
                'Content-Type': 'text/html; charset=' + config.page.charset
            })
            .send(content);
    }
};
