const test = require('node:test');
const assert = require('node:assert/strict');
const { convertQuantity, normalizeUnit } = require('../src/utils/measurement');

test('mass units are normalized and converted in both directions', () => {
    assert.equal(normalizeUnit('gramos'), 'g');
    assert.equal(normalizeUnit('Kilogramos'), 'kg');
    assert.equal(convertQuantity(250, 'g', 'kg'), 0.25);
    assert.equal(convertQuantity(1.5, 'kg', 'gramos'), 1500);
    assert.equal(convertQuantity(2, 'kg', 'kg'), 2);
});

test('incompatible and missing units are rejected', () => {
    assert.equal(convertQuantity(1, 'litros', 'kg'), null);
    assert.equal(convertQuantity(1, '', 'kg'), null);
});
