var falafel = require('../');
var acorn = require('acorn-jsx');
var test = require('tape');

test('custom parser', function (t) {

  var src = '(function() { var a = <div className="test"></div>; })()';

  var nodeTypes = [
    'Identifier',
    'JSXIdentifier',
    'Literal',
    'JSXAttribute',
    'JSXIdentifier',
    'JSXOpeningElement',
    'JSXIdentifier',
    'JSXClosingElement',
    'JSXElement',
    'VariableDeclarator',
    'VariableDeclaration',
    'BlockStatement',
    'FunctionExpression',
    'CallExpression',
    'ExpressionStatement',
    'Program'
  ];

  t.plan(nodeTypes.length);

  var output = falafel(src, {parser: acorn, plugins: { jsx: true }}, function(node) {
    t.equal(node.type, nodeTypes.shift());
  });
});
