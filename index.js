var parse = require('acorn').parse;
var isArray = require('isarray');
var objectKeys = require('object-keys');
var forEach = require('foreach');

var nodeStart = function (n) {
    return n.range ? n.range[0] : n.start;
};
var nodeEnd = function (n) {
    return n.range ? n.range[1] : n.end;
};
var whiteSpaceChars = ['\n', '\t', '\r', ' '];

module.exports = function (src, opts, fn) {
    if (typeof opts === 'function') {
        fn = opts;
        opts = {};
    }
    if (src && typeof src === 'object' && src.constructor.name === 'Buffer') {
        src = src.toString();
    }
    else if (src && typeof src === 'object') {
        opts = src;
        src = opts.source;
        delete opts.source;
    }
    src = src === undefined ? opts.source : src;
    if (typeof src !== 'string') src = String(src);
    if (opts.parser) parse = opts.parser.parse;
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
                walk(child, node);
            }
        });
        fn(node);
    })(ast, undefined);

    return result;
};

function insertHelpers (node, parent, chunks) {
    node.parent = parent;

    node.source = function () {
        var commentHead = '', commentHeadStart = -1, commentHeadEnd = -1;
        var commentFoot = '', commentFootStart = -1, commentFootEnd = -1;
        forEach(node.comments || [], function (comment) {
            if (nodeEnd(comment) <= nodeStart(node)) {
                commentHeadStart = (commentHeadStart !== -1 ? commentHeadStart : nodeStart(comment));
                commentHeadEnd = Math.max(commentHeadEnd, nodeEnd(comment));

                while (whiteSpaceChars.indexOf(chunks[commentHeadStart - 1]) !== -1 && commentHeadStart > 0) {
                    commentHeadStart--;
                }
                while (whiteSpaceChars.indexOf(chunks[commentHeadEnd]) !== -1 && commentHeadEnd < chunks.length) {
                    commentHeadEnd++;
                }
            }
            if (nodeStart(comment) >= nodeEnd(node)) {
                commentFootStart = (commentFootStart !== -1 ? commentFootStart : nodeStart(comment));
                commentFootEnd = Math.max(commentFootEnd, nodeEnd(comment));

                while (whiteSpaceChars.indexOf(chunks[commentFootStart - 1]) !== -1 && commentFootStart > 0) {
                    commentFootStart--;
                }
                while (whiteSpaceChars.indexOf(chunks[commentFootEnd]) !== -1 && commentFootEnd < chunks.length) {
                    commentFootEnd++;
                }
            }
        });

        if (commentHeadStart !== -1) {
            commentHead += chunks.slice(commentHeadStart, commentHeadEnd).join('');
        }
        if (commentFootStart !== -1) {
            commentFoot += chunks.slice(commentFootStart, commentFootEnd).join('');
        }
        return commentHead + chunks.slice(nodeStart(node), nodeEnd(node)).join('') + commentFoot;
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

    function update (s) {
        chunks[nodeStart(node)] = s;
        for (var i = nodeStart(node) + 1; i < nodeEnd(node); i++) {
            chunks[i] = '';
        }
    }
}
