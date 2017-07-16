var parse = require('acorn').parse;
var isArray = require('isarray');
var objectKeys = require('object-keys');
var forEach = require('foreach');
var SourceNode = require("source-map").SourceNode;

var base64 = function (str) {
    return new Buffer(str).toString('base64');
}

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
    opts.locations = true;

    if (typeof src !== 'string') src = String(src);
    if (opts.parser) parse = opts.parser.parse;
    var ast = parse(src, opts);
    
    var result = {
        chunks : src.split(''),
        map : function () {
            var root = new SourceNode(null, null, null, result.chunks);
            root.setSourceContent(opts.sourceFilename || "in.js", src);
            var sm = root.toStringWithSourceMap({ file: opts.generatedFilename || "out.js" });
            return sm.map.toString();
        },
        toString : function () {
            var root = new SourceNode(null, null, null, result.chunks);
            root.setSourceContent(opts.sourceFilename || "in.js", src);
            var sm = root.toStringWithSourceMap({ file: opts.generatedFilename || "out.js" });
            return sm.code + "\n//@ sourceMappingURL=data:application/json;base64," + base64(sm.map.toString()) + "\n";
        },
        inspect : function () { return result.toString() }
    };
    var index = 0;
    
    (function walk (node, parent) {
        insertHelpers(node, parent, result.chunks, opts);
        
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
 
function insertHelpers (node, parent, chunks, opts) {

    node.parent = parent;
    
    node.source = function () {
        return chunks.slice(node.start, node.end).join('');
    };
    
    node.sourceNodes = function () {
        return chunks.slice(
            node.start, node.end
        );
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

    function update () {
        chunks[node.start] = new SourceNode(
            node.loc.start.line,
            node.loc.start.column,
            opts.sourceFilename || "in.js",
            Array.prototype.slice.apply(arguments));
        for (var i = node.start + 1; i < node.end; i++) {
            chunks[i] = '';
        }
    };
}
