var falafel = require('../');
var test = require('tape');
var util = require('util');

test('delete only argument', function (t) {
    var src = '(' + function (a) {
        return a;
    } + ')()';

    var output = falafel(src, function (node) {
        if (node.type === 'FunctionExpression') {
            node.params[0].remove();
        }
    });

    t.equal(output.toString(), '(' + function () {
        return a;
    } + ')()');
    try {
        Function(output)();
        t.fail("Expected an exception to be thrown");
    } catch(e) {
        t.equal(e.message, "a is not defined");
    }
    t.end();
});

test('delete first argument', function (t) {
    var src = '(' + function (a, b) {
        return a + b;
    } + ')()';

    var output = falafel(src, function (node) {
        if (node.type === 'FunctionExpression') {
            node.params[0].remove();
        }
    });

    t.equal(output.toString(), '(' + function (b) {
        return a + b;
    } + ')()');
    try {
        Function(output)();
        t.fail("Expected an exception to be thrown");
    } catch(e) {
        t.equal(e.message, "a is not defined");
    }
    t.end();
});

test('delete last argument', function (t) {
    var src = '(' + function (a, b) {
        return a + b;
    } + ')()';

    var output = falafel(src, function (node) {
        if (node.type === 'FunctionExpression') {
            node.params[1].remove();
        }
    });

    t.equal(output.toString(), '(' + function (a) {
        return a + b;
    } + ')()');
    try {
        Function(output)();
        t.fail("Expected an exception to be thrown");
    } catch(e) {
        t.equal(e.message, "b is not defined");
    }
    t.end();
});

test('delete middle argument', function (t) {
    var src = '(' + function (a, b, c) {
        return a + b * c;
    } + ')()';

    var output = falafel(src, function (node) {
        if (node.type === 'FunctionExpression') {
            node.params[1].remove();
        }
    });

    t.equal(output.toString(), '(' + function (a, c) {
        return a + b * c;
    } + ')()');
    try {
        Function(output)();
        t.fail("Expected an exception to be thrown");
    } catch(e) {
        t.equal(e.message, "b is not defined");
    }
    t.end();
});

test('delete middle argument', function (t) {
    var src = '(' + function (a, b, c) {
        return a + b * c;
    } + ')()';

    var output = falafel(src, function (node) {
        if (node.parent && node.parent.type === "FunctionExpression" && node.type === "Identifier" && (node.name === "a" || node.name === "b")) {
            node.remove();
        }
    });

    t.equal(output.toString(), '(' + function (c) {
        return a + b * c;
    } + ')()');
    try {
        Function(output)();
        t.fail("Expected an exception to be thrown");
    } catch(e) {
        t.equal(e.message, "a is not defined");
    }
    t.end();
});

test('delete standalone variable declarator', function (t) {
    var src = 'var a;';

    var output = falafel(src, function (node) {
        if (node.type === "VariableDeclarator") {
            node.remove();
        }
    });

    t.equal(output.toString(), '');
    t.end();
});

test('delete first variable declarator from list of two declarators', function (t) {
    var src = 'var a, b;';

    var output = falafel(src, function (node) {
        if (node.type === "VariableDeclarator" && node.id.name === "a") {
            node.remove();
        }
    });

    t.equal(output.toString(), 'var b;');
    t.end();
});

test('delete last variable declarator from list of two declarators', function (t) {
    var src = 'var a, b;';

    var output = falafel(src, function (node) {
        if (node.type === "VariableDeclarator" && node.id.name === "b") {
            node.remove();
        }
    });

    t.equal(output.toString(), 'var a;');
    t.end();
});

test('delete middle variable declarator from list of three declarators', function (t) {
    var src = 'var a, b, c;';

    var output = falafel(src, function (node) {
        if (node.type === "VariableDeclarator" && node.id.name === "b") {
            node.remove();
        }
    });

    t.equal(output.toString(), 'var a, c;');
    t.end();
});

test('delete middle variable declarator from list of three declarators with assignments', function (t) {
    var src = 'var a = 1, b = 2, c = 3;';

    var output = falafel(src, function (node) {
        if (node.type === "VariableDeclarator" && node.id.name === "b") {
            node.remove();
        }
    });

    t.equal(output.toString(), 'var a = 1, c = 3;');
    t.end();
});

test('delete element out of an array', function (t) {
    var src = 'var a = [1, "tuple", {}];'

    var output = falafel(src, function (node) {
        if (node.type === "Literal" && node.parent.type === "ArrayExpression" && node.value === 1) {
            node.remove();
        }
    });

    t.equal(output.toString(), 'var a = ["tuple", {}];');
    t.end();
});

test('delete last element out of an array', function (t) {
    var src = 'var a = ["tuple", {}, 3];'

    var output = falafel(src, function (node) {
        if (node.type === "Literal" && node.parent.type === "ArrayExpression" && node.value === 3) {
            node.remove();
        }
    });

    t.equal(output.toString(), 'var a = ["tuple", {}];');
    t.end();
});

test('delete middle element out of an array', function (t) {
    var src = 'var a = ["tuple", 2, {}];'

    var output = falafel(src, function (node) {
        if (node.type === "Literal" && node.parent.type === "ArrayExpression" && node.value === 2) {
            node.remove();
        }
    });

    t.equal(output.toString(), 'var a = ["tuple", {}];');
    t.end();
});
