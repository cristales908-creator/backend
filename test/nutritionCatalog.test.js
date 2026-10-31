const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeDiet } = require('../src/utils/nutritionCatalog');
const dietMigration = require('../src/migrations/202610310003-normalize-legacy-diets');

test('diet normalization accepts legacy prefix and whitespace', () => {
    assert.equal(normalizeDiet('Dieta Blanda'), 'Blanda');
    assert.equal(normalizeDiet('  dieta blanda  '), 'Blanda');
    assert.equal(normalizeDiet('Sin lactosa'), 'Sin lactosa');
});

test('diet normalization rejects values outside the nutrition catalog', () => {
    assert.equal(normalizeDiet('Dieta no válida'), null);
    assert.equal(normalizeDiet(undefined), null);
});

test('legacy diet migration targets the correct columns', async () => {
    const queries = [];
    const queryInterface = {
        sequelize: {
            transaction: callback => callback('test-transaction'),
            query: async (sql, options) => queries.push({ sql, options })
        }
    };

    await dietMigration.up({ context: queryInterface });

    assert.equal(queries.length, 2);
    assert.match(queries[0].sql, /UPDATE "pacientes"\s+SET "dieta_asignada"/);
    assert.match(queries[1].sql, /UPDATE "menus"\s+SET "dieta"/);
    assert.ok(queries.every(query => query.options.transaction === 'test-transaction'));
});