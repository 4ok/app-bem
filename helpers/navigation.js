'use strict';

var logger     = require('logger')();
var Gate       = require('./gate.js');
var Navigation = require('app-core/helpers/navigation.js');

const MENU_ITEM_CHILDREN_PROPERTY = 'children';

const MENU_ITEM_STATES = {
    active      : 'active',
    activeChild : 'active-child'
};

module.exports = class extends Navigation {

    getMenuAsync(name) {
        var self = this;
        var result;

        var gate = new Gate(this._http); // TODO

        return gate.callMethod('menu', {
            filter: {
                name: name
            }
        })
        .then(function (root) {
            result = root;

            return root.items
                .filter(function (item) {
                    return item.hasOwnProperty(MENU_ITEM_CHILDREN_PROPERTY);
                })
                .reduce(function (result, item) {
                    var childrenAlias = item[MENU_ITEM_CHILDREN_PROPERTY];

                    result[childrenAlias] = {
                        name : 'article/tree',
                        args : {
                            filter : {
                                '#parent' : {
                                    alias : childrenAlias
                                }
                            }/*,
                             sort : {
                             field : 'sort',
                             order : 1
                             }*/
                        }
                    };

                    return result;
                }, {});
        })
        .then(function (children) {
            var gate = new Gate(self._http); // TODO

            return gate.callMethod(children);
        })
        .then(function (children) {
            result.items = self._getMenuItems(result.items, children);

            return result;
        })
        .fail(function (err) {
            var message = (err.getMessage)
                ? err.getMessage()
                : (err.stack || err.toString());

            logger.error(message);
        });
    }

    _getMenuItems(items, children) {
        var requestUrl = this._request.url;
        var self       = this;

        return (function getMenuItems(items, levelUrl) {

            return items.map(function (item) {
                var itemUrl = (levelUrl)
                    ? levelUrl.concat(item.alias)
                    : [item.url];

                var itemPageUrl = self.getPageUrl(itemUrl);

                if (itemPageUrl == requestUrl) {
                    item.state = MENU_ITEM_STATES.active;
                } else if (itemUrl && '/' != itemUrl) {
                    var urlProlog;

                    if (item.current) {
                        urlProlog = item.current;
                        delete item.current;
                    } else {
                        urlProlog = itemUrl;
                    }

                    urlProlog = self.getUrl(urlProlog) + '/';

                    if (requestUrl.indexOf(urlProlog) == 0) {
                        item.state = MENU_ITEM_STATES.activeChild;
                    }
                }

                if (item.hasOwnProperty(MENU_ITEM_CHILDREN_PROPERTY)) {
                    var itemChildren;

                    if (levelUrl) {
                        itemChildren = item[MENU_ITEM_CHILDREN_PROPERTY];
                    } else {

                        if (!children.hasOwnProperty([item[MENU_ITEM_CHILDREN_PROPERTY]])) {
                            throw new Error('Menu children "' + item[MENU_ITEM_CHILDREN_PROPERTY] + '" not found');
                        }

                        itemChildren = children[item[MENU_ITEM_CHILDREN_PROPERTY]];
                    }

                    item[MENU_ITEM_CHILDREN_PROPERTY] = getMenuItems(itemChildren, itemUrl);
                }

                item.url = itemPageUrl;

                return item;
            })
        })(items);
    }
};
