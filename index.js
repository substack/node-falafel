var parse = require('esprima').parse;
var objectKeys = Object.keys || function (obj) {
    var keys = [];
    for (var key in obj) keys.push(key);
    return keys;
};
var forEach = function (xs, fn) {
    if (xs.forEach) return xs.forEach(fn);
    for (var i = 0; i < xs.length; i++) {
        fn.call(xs, xs[i], i, xs);
    }
};

var isArray = Array.isArray || function (xs) {
    return Object.prototype.toString.call(xs) === '[object Array]';
};

module.exports = function (src, opts, fn) {
    if (typeof opts === 'function') {
        fn = opts;
        opts = {};
    }
    if (typeof src === 'object') {
        opts = src;
        src = opts.source;
        delete opts.source;
    }
    src = src === undefined ? opts.source : src;
    opts.range = true;
    if (typeof src !== 'string') src = String(src);

    var ast = parse(src, opts);

    var result = {
        chunks : src.split(''),
        toString : function () { return result.chunks.join('') },
        inspect : function () { return result.toString() }
    };
    var index = 0;

    (function walk (node, parent) {
        insertHelpers(node, parent, result.chunks);

        forEach(objectKeys(node), function (key) {
            if (key === 'parent') return;

            var child = node[key];
            if (isArray(child)) {
                forEach(child, function (c) {
                    if (c && typeof c.type === 'string') {
                        walk(c, node);
                    }
                });
            }
            else if (child && typeof child.type === 'string') {
                insertHelpers(child, node, result.chunks);
                walk(child, node);
            }
        });
        fn(node);
    })(ast, undefined);

    return result;
};

function insertHelpers (node, parent, chunks) {
    if (!node.range) return;

    node.parent = parent;

    node.source = function () {
        return chunks.slice(
            node.range[0], node.range[1]
        ).join('');
    };

    if (node.update && typeof node.update === 'object') {
        var prev = node.update;
        forEach(objectKeys(prev), function (key) {
            update[key] = prev[key];
        });
        node.update = update;
    }
    else {
        node.update = update;
    }

    node.remove = remove;

    function update (s) {
        chunks[node.range[0]] = s;
        for (var i = node.range[0] + 1; i < node.range[1]; i++) {
            chunks[i] = '';
        }
    };

    // Get only the non-deleted nodes from the given list.  Doesn't check
    // if ancestors of the node are deleted.
    function rejectDeletedNodes (list) {
        var ret = [];
        forEach(list, function (node){
            if (!node.removed) {
                ret.push(node);
            }
        });
        return ret;
    }

    function remove () {
        if (node.removed) {
            return;
        }
        node.removed = true;
        // If this node is in a list of elements in the parent, we need to properly it from there, too.
        if (node.parent) {
            // Lists of nodes contained within the parent that reference the node.
            var lists = [];
            // If we're truly removing a node, the sibling nodes (which are only known to the parent) should be modified.
            // Realistically, all this does is modify nodes from:
            // * the params field of FunctionExpressions
            // * the declarations field of VariableDeclarations
            // * the elements field of ArrayExpressions
            forEach(objectKeys(node.parent), function(key) {
                var obj = node.parent[key];
                if (isArray(obj) && obj.indexOf(node) > -1) {
                    lists.push(key);
                }
            });

            forEach(lists, function(key) {
                var params = node.parent[key];
                var idx = params.indexOf(node);

                var previousNode, nextNode;
                for (var i = idx - 1; i >= 0; i--) {
                    if (!params[i].removed) {
                        previousNode = params[i];
                        break;
                    }
                }
                if (previousNode) {
                    // Node is not the first element; delete the trailing comma and whitespace from the previous element
                    for (var i = previousNode.range[1]; i < node.range[0]; i++) {
                        chunks[i] = '';
                    }
                } else {
                    for (var i = idx + 1; i < params.length; i++) {
                        if (!params[i].removed) {
                            nextNode = params[i];
                            break;
                        }
                    }
                    if (nextNode) {
                        // Is the first element; delete the trailing comma and whitespace from the current element
                        for (var i = node.range[1]; i < nextNode.range[0]; i++) {
                            chunks[i] = '';
                        }
                    }
                }
            });
        }
        // Occasionally it's more correct to just delete the parent instead of trying to update the node asked for
        var deleteParent;
        // If you have something like "var a;" and you delete the "a", that shouldn't leave you with "var ;".
        // On the other hand, if you have ["a"] and delete the "a", [] is fine.
        deleteParent = node.type === "VariableDeclarator" && node.parent.type === "VariableDeclaration" && rejectDeletedNodes(node.parent.declarations).length === 0;

        if (deleteParent) {
            node.parent.remove();
        } else {
            update(null);
        }
    }
}
