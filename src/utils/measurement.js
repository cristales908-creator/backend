const MASS_UNITS = new Map([
    ['g', 'g'],
    ['gr', 'g'],
    ['gramo', 'g'],
    ['gramos', 'g'],
    ['kg', 'kg'],
    ['kilo', 'kg'],
    ['kilos', 'kg'],
    ['kilogramo', 'kg'],
    ['kilogramos', 'kg']
]);

function normalizeUnit(unit) {
    if (typeof unit !== 'string') return null;
    const normalized = unit.trim().toLocaleLowerCase('es');
    if (!normalized) return null;
    return MASS_UNITS.get(normalized) || normalized;
}

function convertQuantity(quantity, fromUnit, toUnit) {
    const from = normalizeUnit(fromUnit);
    const to = normalizeUnit(toUnit);
    if (!from || !to) return null;
    if (from === to) return quantity;
    if (from === 'g' && to === 'kg') return quantity / 1000;
    if (from === 'kg' && to === 'g') return quantity * 1000;
    return null;
}

module.exports = { convertQuantity, normalizeUnit };
