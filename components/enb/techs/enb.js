const EnbConfig = require('../components/enb/config');

module.exports = (config) => {
    const enbConfig = new EnbConfig(config);
    config.init     = enbConfig.init.bind(enbConfig);
};
