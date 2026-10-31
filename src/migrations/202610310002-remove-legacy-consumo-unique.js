module.exports = {
    async up({ context: queryInterface }) {
        await queryInterface.sequelize.query(
            'ALTER TABLE "consumos" DROP CONSTRAINT IF EXISTS "consumos_pacienteId_alimentoId_key"'
        );
    },
    async down({ context: queryInterface }) {
        await queryInterface.addConstraint('consumos', {
            fields: ['pacienteId', 'alimentoId'],
            type: 'unique',
            name: 'consumos_pacienteId_alimentoId_key'
        });
    }
};