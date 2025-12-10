// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const auth = require('../middlewares/auth');

// Validador simple de email
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// =========================
// REGISTER
// =========================
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'username, email y password son obligatorios' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Email no válido' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const existingByEmail = await User.findOne({ email });
    if (existingByEmail) return res.status(400).json({ message: 'Ya existe una cuenta con ese email' });

    const existingByUsername = await User.findOne({ username });
    if (existingByUsername) return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword
    });

    // Firmar token con _id para que coincida con el middleware
    const token = jwt.sign(
      { _id: newUser._id.toString(), email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const userSafe = newUser.toObject();
    delete userSafe.password;

    res.status(201).json({ message: 'Usuario creado', user: userSafe, token });
  } catch (err) {
    console.error('Error en /api/auth/register:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// =========================
// LOGIN
// =========================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: 'Email y password son obligatorios' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Contraseña incorrecta' });

    // Firmar token con _id
    const token = jwt.sign(
      { _id: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const userSafe = user.toObject();
    delete userSafe.password;

    res.status(200).json({ message: 'Login exitoso', user: userSafe, token });
  } catch (err) {
    console.error('Error en /api/auth/login:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// =========================
// Ruta protegida ejemplo
// =========================
router.get('/profile/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ message: 'Ruta protegida', user });
  } catch (err) {
    console.error('Error en /profile/me:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
