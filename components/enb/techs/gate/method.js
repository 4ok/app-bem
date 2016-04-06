'use strict';

const enb = require('enb');
const buildFlow = enb.buildFlow;
const asyncFs = enb.asyncFs;
const vow = require('vow');

const NEW_LINE = '\n';
const TAB = ' '.repeat(4);

module.exports = buildFlow
    .create()
    .name('gate-method')
    .target('target', '?.gate.js')
    .useFileList('gate.js')
    .justJoinFilesWithComments()
    .builder(function build(filesPaths) {
        return this
            ._readFiles(filesPaths)
            .then((data) => {
                return this._getFormattedString([
                    "'use strict';",
                    '',
                    'module.exports = function () {',
                    this._getMethods(),
                    '',
                    this._getResultFunctionBody(data),
                    '}'
                ], NEW_LINE);
            });
    })
    .methods({

        _getResultFunctionBody(data) {
            const content = this
                ._getJoinedContents(data)
                .replace(/^/gm, TAB);

            return this._getFormattedString([
                content,
                'return result;'
            ], NEW_LINE, TAB);
        },

        _getJoinedContents(data) {
            return data.map(item => {
                return item.content.trim();
            })
            .join(NEW_LINE.repeat(2));
        },

        _getFormattedString(rows, separator, afterSeparator) {
            let result;

            if (separator) {
                result = rows.join(separator);
            }

            if (afterSeparator) {
                result = result.replace(/^/gm, afterSeparator);
            }

            return result;
        },

        _readFiles(filesPaths) {
            return vow.all(filesPaths.map((file) => {
                return asyncFs
                    .read(file.fullname, 'utf-8')
                    .then(content => {
                        return {
                            block : this._getFileBlockName(file),
                            content : content
                        };
                    });
            }));
        },

        _getFileBlockName(file) {
            let result = file.name.split('.')[0];

            if (/[^\w\d_]/.test(result)) {
                result = "'" + result + "'";
            }

            return result;
        },

        // TODO
        _getMethods() {
            return `
    const result = {};
    let blockName;
    let isTrueCondition = true;

    const match = (condition) => {

        if (typeof condition == 'function') {
            condition = condition(this);
        }

        isTrueCondition = condition;

        return () => {};
    };

    const data = () => {

        return (methodsParams) => {

            if (isTrueCondition) {

                if (typeof methodsParams == 'function') {
                    methodsParams = methodsParams(this);
                }

                result[blockName] = methodsParams;
            }
        };
    };

    const block = (name) => {
        isTrueCondition = true;
        blockName = name;

        const result = () => {};
        result.match = match;

        return result;
    };
`;
        }
    })
    .createTech();
