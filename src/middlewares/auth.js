// src/middlewares/auth.js
const jwt = require('jsonwebtoken');

/**
 * @desc    Middleware de autenticación usando JWT
 * @access  Protected routes
 */
const auth = (req, res, next) => {
  try {
    // ---------------------- Obtener token del header ----------------------
    const authHeader = req.header('Authorization');
    if (!authHeader) {
      return res.status(401).json({ message: 'Acceso denegado. No se envió token' });
    }

    // El header debe empezar con "Bearer "
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim() // eliminar "Bearer " y posibles espacios
      : authHeader;

    // ---------------------- Verificar token ----------------------
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // DEBUG opcional 
    console.log('TOKEN DECODIFICADO:', decoded);

    // ---------------------- Normalizar datos del usuario ----------------------
    const userId = decoded._id || decoded.id;
    if (!userId) {
      return res.status(401).json({ message: 'Token inválido: falta _id del usuario' });
    }

    // Guardamos un objeto estandarizado en req.user
    req.user = {
      _id: userId,
      email: decoded.email || null,
      // Puedes agregar más campos si los incluyes en el token
    };

    // ---------------------- Continuar al siguiente middleware ----------------------
    next();

  } catch (err) {
    console.error('Error en auth middleware:', err);
    res.status(401).json({ message: 'Token no válido' });
  }
};

module.exports = auth;
