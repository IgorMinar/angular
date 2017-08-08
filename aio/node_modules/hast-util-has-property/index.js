/**
 * @author Titus Wormer
 * @copyright 2016 Titus Wormer
 * @license MIT
 * @module hast:util:has-property
 * @fileoverview Check whether a node has a property.
 */

'use strict';

/* eslint-env commonjs */

/*
 * Methods.
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Check if `node` has `name`.
 *
 * @param {Node?} node - Node to check.
 * @param {string} name - Property to check.
 * @return {boolean} - Whether `node` has `name`.
 */
function hasProperty(node, name) {
    var props;
    var value;

    if (
        !node ||
        !name ||
        typeof node !== 'object' ||
        node.type !== 'element'
    ) {
        return false;
    }

    props = node.properties;
    value = props && has.call(props, name) && node.properties[name];

    return value !== null && value !== undefined && value !== false;
}

/*
 * Expose.
 */

module.exports = hasProperty;
