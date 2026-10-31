const PATOLOGIAS = [
    'Sin especificar',
    'Hipertensión arterial',
    'Diabetes',
    'Celiaquía',
    'Intolerancia a la lactosa',
    'Enfermedad renal',
    'Disfagia',
    'Otra'
];

const DIETAS = [
    'General',
    'Blanda',
    'Hiposódica',
    'Control de carbohidratos',
    'Sin gluten',
    'Sin lactosa',
    'Renal',
    'Triturada',
    'Personalizada'
];

const COMIDAS = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'];

function normalizeDiet(value) {
    if (typeof value !== 'string') return null;

    const normalized = value.trim().replace(/^dieta\s+/i, '').toLocaleLowerCase('es');
    return DIETAS.find(dieta => dieta.toLocaleLowerCase('es') === normalized) || null;
}

module.exports = { COMIDAS, DIETAS, PATOLOGIAS, normalizeDiet };