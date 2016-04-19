'use strict';

const path = require('path');

// Enb technologies
const enbBaseTechs = require('enb-bem-techs');
const enbFileProvide = require('enb/techs/file-provider');
const enbBorschik = require('enb-borschik/techs/borschik');
const enbStylus = require('enb-stylus/techs/stylus');
const enbPostcss = require('enb-bundle-postcss/techs/enb-bundle-postcss');
const enbBabelBrowserJs = require('enb-babelify/techs/babel-browser-js');
const enbBrowserJs = require('enb-js/techs/browser-js');
const enbFileMerge = require('enb/techs/file-merge');

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
        source : 'gate.js',
        target : '?.gate.js',
        borschik : {
            target : '?.gate.min.js',
            tech : 'js',
        },
    },
    bemtree : {
        source : 'bemtree.js',
        target : '?.bemtree.js',
        borschik : {
            target : '?.bemtree.min.js',
            tech : 'js',
        },
    },
    bemhtml : {
        sources : 'bemhtml.js',
        target : '?.bemhtml.js',
        borschik : {
            target : '?.bemhtml.min.js',
            tech : 'js',
        },
    },
    'browser-js' : {
        source : 'browser.js',
        target : '?.browser.js',
        borschik : {
            target : '?.browser.min.js',
            tech : 'js',
        },
    },
    css : {
        source : ['styl', 'css', 'post.css'],
        target : '?.css',
        borschik : {
            target : '?.min.css',
            tech : 'cleancss',
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

    _getTechs(levels) {
        return [].concat(
            this._getFilesTechs(levels),
            this._getGateMethodTechs(),
            this._getBemtreeTechs(),
            this._getServerBemhtmlTechs(),
            this._getBrowserBemhtmlTechs(),
            this._getCssTechs(),
            this._getBrowserJsTechs(),
            this._getOptimizationTechs()
        );
    }

    _getTargets() {
        return Object
            .keys(FINAL_TECHS)
            .reduce((result, key) => {
                const tech = FINAL_TECHS[key];
                const target = tech.borschik
                    ? tech.borschik.target
                    : tech.target;

                result.push(target);

                return result;
            }, []);
    }

    _addTasks() {
        Object
            .keys(FINAL_TECHS)
            .forEach(key => {
                const tech = FINAL_TECHS[key];
                const target = tech.borschik
                    ? tech.borschik.target
                    : tech.target;

                this._addTask(key, target.slice(2));
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
        const tech = FINAL_TECHS['gate-method'];
        let result = [];

        if (tech) {
            result = [
                [enbGateMethod, {
                    source : tech.source,
                    target : tech.target,
                }],
            ];
        }

        return result;
    }

    _getBemtreeTechs() {
        const tech = FINAL_TECHS.bemtree;
        let result = [];

        if (tech) {
            result = [
                [enbBemtree, {
                    source : tech.source,
                    target : tech.target,
                }],
            ];
        }

        return result;
    }

    _getServerBemhtmlTechs() {
        const tech = FINAL_TECHS.bemhtml;
        let result = [];

        if (tech) {
            result = [
                [enbBemhtml, {
                    source : tech.source,
                    target : tech.target,
                }],
            ];
        }

        return result;
    }

    _getBrowserBemhtmlTechs() {
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
        const tech = FINAL_TECHS['browser-js'];
        let result = [];

        if (tech) {

            result = [
                [enbBrowserJs, {
                    source : tech.source,
                    target : '?.browser.ym.js',
                    includeYM : true,
                }],
                [enbFileMerge, {
                    sources : [
                        '?.browser.ym.js',
                        '?.browser.bemhtml.js',
                    ],
                    target : '?.browser.ym+bemhtml.js',
                }],
                [enbBabelBrowserJs, {
                    sourceTarget : '?.browser.ym+bemhtml.js',
                    target : tech.target,
                    babelOptions : {
                        compact : false,
                        presets : [
                            'es2015',
                        ],
                    },
                }],
            ];
        }

        return result;
    }

    _getCssTechs() {
        const tech = FINAL_TECHS.css;
        let result = [];

        if (tech) {
            result = [
                [enbStylus, {
                    source : tech.source,
                    target : '?.pre.css',
                }],
                [enbPostcss, {
                    source : '?.pre.css',
                    target : tech.target,
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
                    const item = Object.assign({}, tech.borschik, {
                        source : tech.target,
                        minify : this._isMinify,
                    });

                    result.push([enbBorschik, item]);
                }

                return result;
            }, []);
    }
};
