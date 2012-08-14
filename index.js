var parse = require('esprima').parse;

module.exports = function (src, fn) {
    var opts = {};
    if (typeof src === 'object') {
        opts = src;
        src = opts.source;
        delete opts.source;
    }
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
        
        Object.keys(node).forEach(function (key) {
            if (key === 'parent') return;
            
            var child = node[key];
            if (Array.isArray(child)) {
                child.forEach(function (c) {
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
        if (arguments.length !== 0) throw new Error('Source doesn\'t take any arguments, perhaps you meant update?');
        return chunks.slice(
            node.range[0], node.range[1] + 1
        ).join('');
    };
    
    if (typeof node.update === 'object') {
        var prev = node.update;
        Object.keys(prev).forEach(function (key) {
            update[key] = prev[key];
        });
        node.update = update;
    }
    else {
        node.update = update;
    }
    
    function update (s) {
        if (arguments.length !== 1) {
            throw new Error('Update takes exactly one argument of type string and you passed ' + arguments.length + '.');
        }
        if (typeof s !== 'string') {
            throw new Error('The argument to update must be of type string, you passed an argument of type ' + typeof s + '.')
        }
        chunks[node.range[0]] = s;
        for (var i = node.range[0] + 1; i < node.range[1] + 1; i++) {
            chunks[i] = '';
        }
    };
}
