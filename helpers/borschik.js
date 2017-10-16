const Helper = require('app-core/components/helper/abstract');
const fs = require('fs');
const borschik = require('borschik/js/borschik');

const PROJECT_LINKS_FILE = 'bem/links.json';

module.exports = class extends Helper {

    constructor(...args) {
        super(...args);
        const linksFile = this._projectDir + '/' + PROJECT_LINKS_FILE;

        if (fs.existsSync(linksFile)) {
            this.addLinks(linksFile);
        }
    }

    static get return() {
        return borschik;
    }

    static addLinks(links) {

        if (typeof links === 'string') {
            // eslint-disable-next-line global-require, import/no-dynamic-require
            links = require(links);
        }

        borschik.addLinks(links);
    }
};
