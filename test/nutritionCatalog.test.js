const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeDiet } = require('../src/utils/nutritionCatalog');

test('diet normalization accepts legacy prefix and whitespace', () => {
    assert.equal(normalizeDiet('Dieta Blanda'), 'Blanda');
    assert.equal(normalizeDiet('  dieta blanda  '), 'Blanda');
    assert.equal(normalizeDiet('Sin lactosa'), 'Sin lactosa');
});

test('diet normalization rejects values outside the nutrition catalog', () => {
    assert.equal(normalizeDiet('Dieta no válida'), null);
    assert.equal(normalizeDiet(undefined), null);
});