var falafel = require('../');
var test = require('tape');

test('ancestor', function (t) {
    t.plan(3);
    var src = '(' + function () {
      var xs = [ 1, 2, 3 ];
      fn(ys);
    } + ')()';

    var output = falafel(src, function (node) {
        if (node.type === 'ArrayExpression') {
            t.equal(node.getAncestor('FunctionExpression').type, 'FunctionExpression')
            t.equal(node.getAncestor('FunctionExpression').getAncestor('ExpressionStatement').type, 'ExpressionStatement');
            t.equal(node.getAncestor('VariableDeclarator').source(), 'xs = [ 1, 2, 3 ]');
        }
    });
});
