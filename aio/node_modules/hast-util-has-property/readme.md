# hast-util-has-property [![Build Status][build-badge]][build-page] [![Coverage Status][coverage-badge]][coverage-page]

Check whether a [HAST node][hast] is an [element][] with a [property][].

## Installation

[npm][]:

```bash
npm install hast-util-has-property
```

**hast-util-has-property** is also available as an AMD, CommonJS, and
globals module, [uncompressed and compressed][releases].

## Usage

Dependencies:

```javascript
var hasProperty = require('hast-util-has-property');
```

Checks:

```javascript
var a = hasProperty({
    'type': 'text',
    'value': 'alpha'
}, 'bravo');
var b = hasProperty({
    'type': 'element',
    'tagName': 'div',
    'properties': {
        'id': 'bravo'
    },
    'children': []
}, 'className');
var c = hasProperty({
    'type': 'element',
    'tagName': 'div',
    'properties': {
        'id': 'charlie'
    },
    'children': []
}, 'id');
```

Yields:

```txt
a: false
b: false
c: true
```

## API

### `hasProperty(node, name)`

**Parameters**:

*   `node` ([`Node`][node], optional) — Node to check.
*   `name` ([`string`][property]) - Property name to check.

**Returns**:

`boolean` — Whether `node` is an [`Element`][element] with a property
by `name`.

## License

[MIT][license] © [Titus Wormer][author]

<!-- Definition -->

[build-badge]: https://img.shields.io/travis/wooorm/hast-util-has-property.svg

[build-page]: https://travis-ci.org/wooorm/hast-util-has-property

[coverage-badge]: https://img.shields.io/codecov/c/github/wooorm/hast-util-has-property.svg

[coverage-page]: https://codecov.io/github/wooorm/hast-util-has-property?branch=master

[npm]: https://docs.npmjs.com/cli/install

[releases]: https://github.com/wooorm/hast-util-has-property/releases

[license]: LICENSE

[author]: http://wooorm.com

[hast]: https://github.com/wooorm/hast

[node]: https://github.com/wooorm/hast#node

[element]: https://github.com/wooorm/hast#element

[property]: https://github.com/wooorm/hast#property-names
