const borschik = require('borschik/js/borschik'); // todo add to package.json

module.exports = class {

    constructor() {

    }

    get() {
        // const links = require('../../links.json');
        console.log('!!!!!!!!!!!!!!!!!!', __dirname)
        return borschik;
    }
};
