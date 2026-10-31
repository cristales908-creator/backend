const crypto = require('node:crypto');
const Usuario = require('../models/usuario');
const { createToken } = require('../middleware/auth');
const { hashPassword, verifyPassword } = require('../utils/password');

const ROLES = ['Enfermera', 'Nutricionista', 'Cocinera'];

function hasValidRegistrationKey(key) {
    const expected = process.env.STAFF_REGISTRATION_KEY;
    if (!expected || expected.length < 32
        || expected === 'replace-with-a-private-registration-key'
        || typeof key !== 'string') return false;

    const expectedBuffer = Buffer.from(expected);
    const suppliedBuffer = Buffer.from(key);
    return expectedBuffer.length === suppliedBuffer.length
        && crypto.timingSafeEqual(expectedBuffer, suppliedBuffer);
}

async function registrar(req, res) {
    const { dni, nombre, contrasena, rol, claveRegistro } = req.body || {};
    if (typeof dni !== 'string' || !dni.trim()
        || typeof nombre !== 'string' || !nombre.trim()
        || typeof contrasena !== 'string' || contrasena.length < 8
        || !ROLES.includes(rol)) {
        return res.status(400).json({ error: 'Revisa los datos; la contraseña debe tener al menos 8 caracteres.' });
    }
    if (!hasValidRegistrationKey(claveRegistro)) {
        return res.status(403).json({ error: 'Se requiere una clave de autorización válida para registrarse.' });
    }

    try {
        const nuevoUsuario = await Usuario.create({
            dni: dni.trim(),
            nombre: nombre.trim(),
            contrasena: await hashPassword(contrasena),
            rol
        });
        res.status(201).json({
            id: nuevoUsuario.id,
            dni: nuevoUsuario.dni,
            nombre: nuevoUsuario.nombre,
            rol: nuevoUsuario.rol
        });
    } catch (err) {
        console.error('Error al registrar usuario:', err.message);
        if (err.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'El DNI ya está registrado.' });
        }
        res.status(500).json({ error: 'No se pudo registrar el usuario.' });
    }
}

async function iniciarSesion(req, res) {
    const { dni, contrasena } = req.body || {};
    if (typeof dni !== 'string' || typeof contrasena !== 'string' || !dni.trim() || !contrasena) {
        return res.status(400).json({ error: 'Ingresa DNI y contraseña.' });
    }

    try {
        const usuario = await Usuario.findOne({ where: { dni: dni.trim() } });
        if (!usuario || !(await verifyPassword(contrasena, usuario.contrasena))) {
            return res.status(401).json({ login: false, error: 'DNI o contraseña incorrectos.' });
        }

        if (!usuario.contrasena.startsWith('scrypt$')) {
            usuario.contrasena = await hashPassword(contrasena);
            await usuario.save();
        }

        const datosUsuario = {
            id: usuario.id,
            dni: usuario.dni,
            nombre: usuario.nombre,
            rol: usuario.rol
        };
        res.json({ login: true, usuario: datosUsuario, token: createToken(datosUsuario) });
    } catch (err) {
        console.error('Error en el login:', err.message);
        res.status(500).json({ error: 'No se pudo iniciar sesión.' });
    }
}

module.exports = { iniciarSesion, registrar };