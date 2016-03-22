'use strict'

const enb       = require('enb');
const buildFlow = enb.buildFlow;
const asyncFs   = enb.asyncFs;
const vow       = require('vow');

const NEW_LINE = '\n';

const TAB = ' '.repeat(4);

module.exports = module.exports = buildFlow
    .create()
    .name('gate-method')
    .target('target', '?.gate.js')
    .useFileList('gate.js')
    .justJoinFilesWithComments()
    .builder(function (filesPaths) {

        return this.
            _readFiles(filesPaths)
            .then((data) => {

                return this._getFormattedString([
                    "'use strict'",
                    '',
                    'module.exports = function () {',
                    '',
                    this._getResultFunctionBody(data),
                    '}'
                ], NEW_LINE);
            });
    })
    .methods({

        _getResultFunctionBody: function (data) {
            const content = this
                ._getJoinedContents(data)
                .replace(/^/gm, TAB);

            return this._getFormattedString([
                'return {',
                content,
                '}'
            ], NEW_LINE, TAB);
        },

        _getJoinedContents: function (data) {

            return data.map(item => {
                const content = item.content
                    .trim()
                    .replace(/;$/, '');

                return item.block + ' : ' + content;
            })
            .join(',\n');
        },

        _getFormattedString: function (rows, separator, afterSeparator) {
            let result;

            if (separator) {
                result = rows.join(separator);
            }

            if (afterSeparator) {
                result = result.replace(/^/gm, afterSeparator);
            }

            return result;
        },

        _readFiles: function (filesPaths) {

            return vow.all(filesPaths.map((file) => {

                return asyncFs
                    .read(file.fullname, 'utf-8')
                    .then(content => {

                        return {
                            block   : this._getFileBlockName(file),
                            content : content
                        }
                    });
            }));
        },

        _getFileBlockName: function (file) {
            let result = file.name.split('.')[0];

            if (/[^\w\d_]/.test(result)) {
                result = "'" + result + "'";
            }

            return result;
        }
    })
    .createTech();
