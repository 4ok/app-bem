'use strict';

const path = require('path');

// Enb technologies
const enbBaseTechs   = require('enb-bem-techs');
const enbFileProvide = require('enb/techs/file-provider');
const enbFileMerge   = require('enb/techs/file-merge');
const enbBorschik    = require('enb-borschik/techs/borschik');
const enbStylus      = require('enb-stylus/techs/stylus');
const enbPostcss     = require('enb-bundle-postcss/techs/enb-bundle-postcss');
const enbBrowserJs   = require('enb-js/techs/browser-js');
const enbBemtree     = require('enb-bemxjst/techs/bemtree');
const enbBemhtml     = require('enb-bemxjst/techs/bemhtml');

// Postcss plugins
const postcssSimpleVars = require('postcss-simple-vars');
const postcssFontpath   = require('postcss-fontpath');
const postcssBemGrid    = require('bem-grid').postcss;
const autoprefixer      = require('autoprefixer');

module.exports = class {

    constructor(config) {
        this._config = config;
    }

    init(nodes, levels, env) {
        const isDev       = (!env || env === 'development');
        this._nodes       = nodes;
        this._isMinify    = !isDev;
        this._isSourcemap = !isDev;

        this._addTechsAndTargets(levels);

        const tasks = {
            bemtree : 'bemtree.final.js',
            bemhtml : 'bemhtml.final.js',
            css     : 'final.css',
            js      : 'final.js'
        };

        Object
            .keys(tasks)
            .map(taskName => this._addTask(taskName, tasks[taskName]))
    }

    _addTechsAndTargets(levels) {
        this._config.nodes(this._nodes, (nodeConfig) => {
            nodeConfig.addTechs(this._getTechs(levels));
            nodeConfig.addTargets(this._getTargets());
        });
    }

    _addTask(taskName, fileSuffix) {

        this._config.task(taskName, (task) => {

            return task.buildTargets(this._nodes.map((node) => {
                const fileName = path.basename(node) + '.' + fileSuffix;

                return path.join(node, fileName);
            }));
        });
    }

    _getTechs(levels) {

        return [].concat(
            this._getFilesTechs(levels),
            this._getCssTechs(),
            this._getBemtreeTechs(),
            this._getServerBemhtmlTechs(),
            this._getClientBemhtmlTechs(),
            this._getClientJsTechs(),
            this._getOptimizationTechs()
        );
    }

    _getTargets() {

        return [
            '?.final.css',
            '?.final.js',
            '?.bemhtml.final.js',
            '?.bemtree.final.js'
        ];
    }

    _getFilesTechs(levels) {

        return [
            [enbBaseTechs.levels, {
                levels : levels
            }],
            [enbFileProvide, {
                target : '?.bemdecl.js'
            }],
            [enbBaseTechs.deps],
            [enbBaseTechs.files]
        ]
    }

    _getCssTechs() {

        return [
            [enbStylus, {
                sourceSuffixes : ['styl', 'css', 'post.css'],
                target         : '?.post.css'
            }],
            [enbPostcss, {
                source    : '?.post.css',
                target    : '?.css',
                sourcemap : this._isSourcemap,
                plugins   : this._getPostcssPlugins()
            }]
        ]
    }

    _getPostcssPlugins() {

        return [
            postcssSimpleVars({
                variables : {
                    fontsDir : '../../blocks/font'
                }
            }),
            postcssFontpath,
            postcssBemGrid({
                maxWidth: '1100px',
                gutter: '10px',
                flex: 'flex'
            }),
            autoprefixer({
                browsers : [
                    'ie >= 10',
                    'last 2 versions',
                    'opera 12.1',
                    '> 2%'
                ]
            })
        ];
    }

    _getBemtreeTechs() {

        return [
            [enbBemtree, {
                devMode    : false,
                includeVow : false,
                requires: {
                    moment: {
                        commonJS: 'moment'
                    }
                }
            }]
        ]
    }

    _getServerBemhtmlTechs() {

        return [
            [enbBemhtml, {
                devMode : false
            }]
        ]
    }

    _getClientBemhtmlTechs() {

        return [
            [enbBaseTechs.depsByTechToBemdecl, {
                target     : '?.bemhtml.bemdecl.js',
                sourceTech : 'js',
                destTech   : 'bemhtml'
            }],
            [enbBaseTechs.deps, {
                target      : '?.bemhtml.deps.js',
                bemdeclFile : '?.bemhtml.bemdecl.js'
            }],
            [enbBaseTechs.files, {
                depsFile    : '?.bemhtml.deps.js',
                filesTarget : '?.bemhtml.files',
                dirsTarget  : '?.bemhtml.dirs'
            }],
            [enbBemhtml, {
                target      : '?.browser.bemhtml.js',
                filesTarget : '?.bemhtml.files',
                devMode     : (process.env.BEMHTML_ENV === 'development')
            }]
        ]
    }

    _getClientJsTechs() {

        return [
            [enbBrowserJs, {
                includeYM : true
            }],
            [enbFileMerge, {
                target  : '?.js',
                sources : [
                    '?.browser.js',
                    '?.browser.bemhtml.js'
                ]
            }]
        ]
    }

    _getOptimizationTechs() {
        const isMinify = this._isMinify;

        return [
            [enbBorschik, {
                source : '?.css',
                target : '?.final.css',
                tech   : 'cleancss',
                minify : isMinify
            }],
            [enbBorschik, {
                source : '?.js',
                target : '?.final.js',
                freeze : true,
                minify : isMinify
            }],
            [enbBorschik, {
                source : '?.bemhtml.js',
                target : '?.bemhtml.final.js',
                tech   : 'js',
                freeze : true,
                minify : isMinify
            }],
            [enbBorschik, {
                source : '?.bemtree.js',
                target : '?.bemtree.final.js',
                tech   : 'js',
                freeze : true,
                minify : isMinify
            }]
        ]
    }
};
