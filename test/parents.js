var falafel = require('../');
var test = require('tap').test;

test('parents', function (t) {
    t.plan(2);
    
    var src = '(' + function () {
        var xs = [ 1, 2, 3 ];
        fn(ys);
    } + ')()';
    
    var output = falafel(src, function (node) {
        if (node.type === 'ArrayExpression') {
            t.equal(node.parents('type=VariableDeclaration').source(), 'var xs = [ 1, 2, 3 ];');
            t.notOk(node.parents('anAttr=SomeValue'));
        }
    });
});
