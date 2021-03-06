const Helper = require('app-core/components/helper/abstract');
const fs = require('fs');
const borschik = require('borschik/js/borschik');

const PROJECT_LINKS_FILE = 'bem/links.json';

module.exports = class extends Helper {

    constructor(...args) {
        super(...args);

        const linksFile = this._projectDir + '/' + PROJECT_LINKS_FILE;

        if (fs.existsSync(linksFile)) {
            // eslint-disable-next-line global-require, import/no-dynamic-require
            const links = require(linksFile);

            borschik.addLinks(links);
        }
    }

    // eslint-disable-next-line class-methods-use-this
    get return() {
        return borschik;
    }
};
