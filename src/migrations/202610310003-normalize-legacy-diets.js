function normalizedDietExpression(column) {
    return `CASE lower(regexp_replace(btrim("${column}"), '^Dieta[[:space:]]+', '', 'i'))
        WHEN 'general' THEN 'General'
        WHEN 'blanda' THEN 'Blanda'
        WHEN 'hiposódica' THEN 'Hiposódica'
        WHEN 'control de carbohidratos' THEN 'Control de carbohidratos'
        WHEN 'sin gluten' THEN 'Sin gluten'
        WHEN 'sin lactosa' THEN 'Sin lactosa'
        WHEN 'renal' THEN 'Renal'
        WHEN 'triturada' THEN 'Triturada'
        WHEN 'personalizada' THEN 'Personalizada'
        ELSE "${column}"
    END`;
}

module.exports = {
    async up({ context: queryInterface }) {
        await queryInterface.sequelize.transaction(async transaction => {
            for (const [table, column] of [['pacientes', 'dieta_asignada'], ['menus', 'dieta']]) {
                await queryInterface.sequelize.query(`
                    UPDATE "${table}"
                    SET "${column}" = ${normalizedDietExpression(column)}
                    WHERE "${column}" ~* '^Dieta[[:space:]]+(General|Blanda|Hiposódica|Control de carbohidratos|Sin gluten|Sin lactosa|Renal|Triturada|Personalizada)$'
                `, { transaction });
            }
        });
    },
    async down() {
        throw new Error('La normalización de dietas no es reversible porque el prefijo original no se conserva.');
    }
};