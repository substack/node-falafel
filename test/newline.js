var falafel = require('../');
var test = require('tape');

test('newline', function (t) {
    t.plan(2);

    var src = 'var a = 0;\ncall();\nvar b = 1;\n';

    var out0 = falafel(src, function (node) {
        if (node.type === 'ExpressionStatement') {
            node.update('', { newline: true });
        }
    });

    var out1 = falafel(src, function (node) {
        if (node.type === 'ExpressionStatement') {
            node.update('', { newline: false });
        }
    });

    t.equal(out0.toString(), 'var a = 0;\nvar b = 1;\n');
    t.equal(out1.toString(), 'var a = 0;\n\nvar b = 1;\n');
});
