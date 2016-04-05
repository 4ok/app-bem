const EnbConfig = require('../config');

module.exports = (config) => {
    const enbConfig = new EnbConfig(config);

    config.init = enbConfig.init.bind(enbConfig);
};
