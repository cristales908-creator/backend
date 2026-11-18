const Alimento = require('../models/alimento');
const HistorialAlmacen = require('../models/historialAlmacen');
const sequelize = require('../config/database');
const { convertQuantity, normalizeUnit } = require('../utils/measurement');

function parseNonNegativeNumber(value) {
    if ((typeof value !== 'number' && typeof value !== 'string')
        || (typeof value === 'string' && !value.trim())) return null;

    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
}

async function listar(req, res) {
    try {
        const alimentos = await Alimento.findAll({ order: [['fecha_vencimiento', 'ASC']] });
        res.json(alimentos || []);
    } catch (err) {
        console.error('Error al obtener alimentos:', err.message);
        res.status(500).json({ error: 'No se pudo obtener el stock del almacén.' });
    }
}

async function listarHistorial(req, res) {
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 200) : 50;

    try {
        const historial = await HistorialAlmacen.findAll({
            order: [['fecha', 'DESC'], ['id', 'DESC']],
            limit
        });
        res.json(historial);
    } catch (err) {
        console.error('Error al obtener el historial del almacén:', err.message);
        res.status(500).json({ error: 'No se pudo obtener el historial del almacén.' });
    }
}

async function crear(req, res) {
    const { nombre, cantidad_actual, stock_minimo, unidad_medida, fecha_ingreso, fecha_vencimiento } = req.body || {};
    const cantidad = Number(cantidad_actual);
    const minimo = stock_minimo === undefined ? 0 : parseNonNegativeNumber(stock_minimo);
    if (typeof nombre !== 'string' || !nombre.trim()
        || typeof unidad_medida !== 'string' || !unidad_medida.trim()
        || !Number.isFinite(cantidad) || cantidad <= 0
        || minimo === null) {
        return res.status(400).json({ error: 'Nombre, unidad, cantidad positiva y stock mínimo no negativo son obligatorios.' });
    }

    let transaction;
    try {
        transaction = await sequelize.transaction();
        const nuevoAlimento = await Alimento.create({
            nombre: nombre.trim(),
            cantidad_actual: cantidad,
            stock_minimo: minimo,
            unidad_medida: unidad_medida.trim(),
            fecha_ingreso: fecha_ingreso || null,
            fecha_vencimiento: fecha_vencimiento || null
        }, { transaction });
        await HistorialAlmacen.create({
            usuario_id: req.user.id,
            usuario_nombre: req.user.nombre,
            usuario_rol: req.user.rol,
            alimento_nombre: nuevoAlimento.nombre,
            accion: 'INGRESO',
            cantidad
        }, { transaction });

        await transaction.commit();
        res.status(201).json(nuevoAlimento);
    } catch (err) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error('Error al registrar alimento:', err.message);
        res.status(500).json({ error: 'No se pudo registrar el alimento.' });
    }
}

async function actualizarStockMinimo(req, res) {
    const id = Number(req.params.id);
    const minimo = parseNonNegativeNumber(req.body?.stock_minimo);
    if (!Number.isInteger(id) || id <= 0 || minimo === null) {
        return res.status(400).json({ error: 'El identificador y un stock mínimo no negativo son obligatorios.' });
    }

    try {
        const alimento = await Alimento.findByPk(id);
        if (!alimento) return res.status(404).json({ error: 'No se encontró el alimento.' });

        await alimento.update({ stock_minimo: minimo });
        res.json({ mensaje: 'Stock mínimo actualizado.', alimento });
    } catch (err) {
        console.error('Error al actualizar stock mínimo:', err.message);
        res.status(500).json({ error: 'No se pudo actualizar el stock mínimo.' });
    }
}

async function consumoRetirado(req, res) {
    const alimentoId = Number(req.body?.alimentoId);
    const cantidad = Number(req.body?.cantidad);
    const unidadRetiro = req.body?.unidadRetiro;

    if (!Number.isInteger(alimentoId) || !Number.isFinite(cantidad) || cantidad <= 0
        || typeof unidadRetiro !== 'string' || !normalizeUnit(unidadRetiro)) {
        return res.status(400).json({ error: 'Selecciona un ingrediente, una unidad y una cantidad positiva.' });
    }

    let transaction;
    try {
        transaction = await sequelize.transaction();
        const alimento = await Alimento.findByPk(alimentoId, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!alimento) {
            await transaction.rollback();
            return res.status(404).json({ error: 'El ingrediente seleccionado no existe.' });
        }

        const disponible = Number(alimento.cantidad_actual);
        const cantidadEnStock = convertQuantity(cantidad, unidadRetiro, alimento.unidad_medida);
        if (cantidadEnStock === null) {
            await transaction.rollback();
            return res.status(400).json({
                error: `La unidad ${unidadRetiro} no es compatible con el stock expresado en ${alimento.unidad_medida}.`
            });
        }

        if (cantidadEnStock > disponible) {
            await transaction.rollback();
            return res.status(400).json({
                error: `Stock insuficiente. Solo quedan ${disponible} ${alimento.unidad_medida} de ${alimento.nombre}.`
            });
        }

        const restante = Number((disponible - cantidadEnStock).toFixed(6));
        await alimento.update({ cantidad_actual: restante }, { transaction });
        await HistorialAlmacen.create({
            usuario_id: req.user.id,
            usuario_nombre: req.user.nombre,
            usuario_rol: req.user.rol,
            alimento_nombre: alimento.nombre,
            accion: `RETIRO_USO (${normalizeUnit(unidadRetiro)})`,
            cantidad
        }, { transaction });

        await transaction.commit();
        res.json({
            mensaje: 'Uso de ingrediente registrado.',
            alimento: alimento.toJSON(),
            cantidad_retirada: cantidad,
            unidad_retiro: normalizeUnit(unidadRetiro),
            cantidad_descontada: cantidadEnStock,
            unidad_stock: alimento.unidad_medida
        });
    } catch (err) {
        if (transaction && !transaction.finished) await transaction.rollback();
        console.error('Error al registrar el uso de alimento:', err.message);
        res.status(500).json({ error: 'No se pudo registrar el uso del ingrediente.' });
    }
}

module.exports = { actualizarStockMinimo, consumoRetirado, crear, listar, listarHistorial };