'use strict';

const path = require('path');

// Enb technologies
const enbBaseTechs = require('enb-bem-techs');
const enbFileProvide = require('enb/techs/file-provider');
const enbBorschik = require('enb-borschik/techs/borschik');
const enbStylus = require('enb-stylus/techs/stylus');
const enbPostcss = require('enb-bundle-postcss/techs/enb-bundle-postcss');
const enbBemBabel = require('enb-bem-babel/techs/bem-babel');
const enbPrependModules = require('enb-modules/techs/prepend-modules');

// const enbBemtree = require('enb-bemxjst/techs/bemtree');
// const enbBemhtml = require('enb-bemxjst/techs/bemhtml');
const enbBemtree = require('app-bem/components/enb/enb-bemxjst/techs/bemtree'); // TODO: https://github.com/enb/enb-bemxjst/issues/139
const enbBemhtml = require('app-bem/components/enb/enb-bemxjst/techs/bemhtml'); // TODO: https://github.com/enb/enb-bemxjst/issues/139

const enbGateMethod = require('app-bem/components/enb/techs/gate-method');

// Postcss plugins
const postcssSimpleVars = require('postcss-simple-vars');
const postcssFontpath = require('postcss-fontpath');
const postcssBemGrid = require('bem-grid').postcss;
const autoprefixer = require('autoprefixer');

// Final technologies
const FINAL_TECHS = {
    'gate-method' : {
        target : 'gate.final.js',
    },
    bemtree : {
        source : 'bemtree.js',
        target : 'bemtree.final.js',
        borschik : {
            tech : 'js',
        },
    },
    bemhtml : {
        source : 'bemhtml.js',
        target : 'bemhtml.final.js',
        borschik : {
            tech : 'js',
        },
    },
    css : {
        source : 'css',
        target : 'final.css',
        borschik : {
            tech : 'cleancss',
        },
    },
    'browser-js' : {
        source : 'browser.js',
        target : 'final.browser.js',
        borschik : {
            tech : 'js',
        },
    },
};

module.exports = class {

    constructor(config) {
        this._config = config;
    }

    init(nodes, levels, env) {
        const isDev = (!env || env === 'development');

        this._nodes = nodes;
        this._isMinify = !isDev;
        this._isSourcemap = !isDev;

        this._addTechsAndTargets(levels);
        this._addTasks();
    }

    _addTechsAndTargets(levels) {
        this._config.nodes(this._nodes, nodeConfig => {
            nodeConfig.addTechs(this._getTechs(levels));
            nodeConfig.addTargets(this._getTargets());
        });
    }

    _addTasks() {
        Object
            .keys(FINAL_TECHS)
            .forEach(key => {
                const requireTechParam = FINAL_TECHS[key];
                const requireTech = requireTechParam.target;

                this._addTask(key, requireTech);
            });
    }

    _addTask(taskName, fileSuffix) {

        this._config.task(taskName, task =>

            task.buildTargets(this._nodes.map(node => {
                const fileName = path.basename(node) + '.' + fileSuffix;

                return path.join(node, fileName);
            }))
        );
    }

    _getTechs(levels) {
        return [].concat(
            this._getFilesTechs(levels),
            this._getGateMethodTechs(),
            this._getBemtreeTechs(),
            this._getServerBemhtmlTechs(),
            this._getClientBemhtmlTechs(),
            this._getCssTechs(),
            this._getBrowserJsTechs(),
            this._getOptimizationTechs()
        );
    }

    _getTargets() {
        return Object
            .keys(FINAL_TECHS)
            .reduce((result, key) => {
                const requireTechParam = FINAL_TECHS[key];
                const requireTech = requireTechParam.target;
                const target = '?.' + requireTech;

                result.push(target);

                return result;
            }, []);
    }

    _getFilesTechs(levels) {
        return [
            [enbFileProvide, {
                target : '?.bemdecl.js',
            }],
            [enbBaseTechs.levels, {
                levels,
            }],
            [enbBaseTechs.deps],
            [enbBaseTechs.files],
        ];
    }

    _getGateMethodTechs() {
        let result = [];

        if (FINAL_TECHS['gate-method']) {
            result = [
                [enbGateMethod, {
                    target : '?.gate.final.js',
                }],
            ];
        }

        return result;
    }

    _getBemtreeTechs() {
        let result = [];

        if (FINAL_TECHS.bemtree) {
            result = [
                [enbBemtree, {
                    devMode : false,
                    includeVow : false,
                }],
            ];
        }

        return result;
    }

    _getServerBemhtmlTechs() {
        let result = [];

        if (FINAL_TECHS.bemhtml) {
            result = [
                [enbBemhtml, {
                    sourceSuffixes : ['bemhtml', 'bemhtml.js'],
                }],
            ];
        }

        return result;
    }

    _getClientBemhtmlTechs() {
        let result = [];

        if (FINAL_TECHS['browser-js']) {
            result = [
                [enbBaseTechs.depsByTechToBemdecl, {
                    target : '?.bemhtml.bemdecl.js',
                    sourceTech : 'js',
                    destTech : 'bemhtml',
                }],
                [enbBaseTechs.deps, {
                    target : '?.bemhtml.deps.js',
                    bemdeclFile : '?.bemhtml.bemdecl.js',
                }],
                [enbBaseTechs.files, {
                    depsFile : '?.bemhtml.deps.js',
                    filesTarget : '?.bemhtml.files',
                    dirsTarget : '?.bemhtml.dirs',
                }],
                [enbBemhtml, {
                    target : '?.browser.bemhtml.js',
                    filesTarget : '?.bemhtml.files',
                    devMode : (process.env.BEMHTML_ENV === 'development'),
                }],
            ];
        }

        return result;
    }

    _getBrowserJsTechs() {
        let result = [];

        if (FINAL_TECHS['browser-js']) {
            result = [
                [enbBemBabel, {
                    bemhtmlFile : '?.browser.bemhtml.js',
                    target : '?.babel.js',
                }],
                [enbPrependModules, {
                    source : '?.babel.js',
                    target : '?.browser.js',
                }],
            ];
        }

        return result;
    }

    _getCssTechs() {
        let result = [];

        if (FINAL_TECHS.css) {
            result = [
                [enbStylus, {
                    sourceSuffixes : ['styl', 'css', 'post.css'],
                    target : '?.post.css',
                }],
                [enbPostcss, {
                    source : '?.post.css',
                    target : '?.css',
                    sourcemap : this._isSourcemap,
                    plugins : this._getPostcssPlugins(),
                }],
            ];
        }

        return result;
    }

    _getPostcssPlugins() {
        let result = [];

        if (FINAL_TECHS.css) {
            result = [
                postcssSimpleVars({
                    variables : {
                        fontsDir : '../../blocks/font',
                    },
                }),
                postcssFontpath,
                postcssBemGrid({
                    maxWidth : '1100px',
                    gutter : '10px',
                    flex : 'flex',
                }),
                autoprefixer({
                    browsers : [
                        'ie >= 10',
                        'last 2 versions',
                        'opera 12.1',
                        '> 2%',
                    ],
                }),
            ];
        }

        return result;
    }

    _getOptimizationTechs() {
        return Object
            .keys(FINAL_TECHS)
            .reduce((result, key) => {
                const tech = FINAL_TECHS[key];

                if (tech.borschik) {
                    const item = Object.assign({
                        source : '?.' + tech.source,
                        target : '?.' + tech.target,
                        freeze : true,
                        minify : this._isMinify,
                    }, tech.borschik);

                    result.push([enbBorschik, item]);
                }

                return result;
            }, []);
    }
};
