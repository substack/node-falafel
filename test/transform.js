var falafel = require('../');
var test = require('tape');

test('prepend', function (t) {
    t.plan(1);

    var src = '(function test() {})();';
    var output = falafel(src, function (node) {
        if (node.type === 'FunctionExpression') {
            node.prepend('async ');
        }
    });

    t.equal(output.toString(), '(async function test() {})();');
});
