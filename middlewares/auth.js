// src/middlewares/auth.js
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  try {
    const authHeader = req.header('Authorization'); // Obtener header
    if (!authHeader) {
      return res.status(401).json({ message: 'Acceso denegado. No se envió token' });
    }

    // El header debe empezar con "Bearer "
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7).trim() // eliminar "Bearer " y espacios
      : authHeader;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // DEBUG opcional — comenta si no quieres logs
    console.log('TOKEN DECODIFICADO:', decoded);

    // Normalizar a req.user._id
    const userId = decoded._id || decoded.id;
    if (!userId) {
      return res.status(401).json({ message: 'Token inválido: falta _id del usuario' });
    }

    // Guardamos un objeto estandarizado en req.user
    req.user = {
      _id: userId,
      email: decoded.email || null,
      // puedes agregar más campos si los incluyes en el token
    };

    next();
  } catch (err) {
    console.error('Error en auth middleware:', err);
    res.status(401).json({ message: 'Token no válido' });
  }
};

module.exports = auth;
