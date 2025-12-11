const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Anime = require('../models/Anime');
const auth = require('../middlewares/auth');
const bcrypt = require('bcryptjs');

// =========================
// GET perfil propio (con animes)
// =========================
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'animes.animeId',
        select: 'title image genre rating description',
        options: { lean: true },
      });

    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const filteredAnimes = [];
    for (let i = 0; i < user.animes.length; i++) {
      const a = user.animes[i];
      try {
        if (!a.animeId) continue;
        const animeObj = a.toObject ? a.toObject() : { ...a };
        if (animeObj.score !== undefined) {
          animeObj.rating = animeObj.score;
          delete animeObj.score;
        }
        filteredAnimes.push(animeObj);
      } catch (innerErr) {
        console.error(`Error procesando anime en /me posición ${i}:`, innerErr, a);
      }
    }

    res.json({ ...user.toJSON(), animes: filteredAnimes });
  } catch (err) {
    console.error('Error en GET /user/me:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// =========================
// PATCH actualizar perfil propio
// =========================
router.patch('/me', auth, async (req, res) => {
  try {
    const { username, email, avatar, password } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    if (username) user.username = username;
    if (email) user.email = email;
    if (avatar) user.avatar = avatar;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    res.json({ message: 'Perfil actualizado', user: user.toJSON() });
  } catch (err) {
    console.error('Error en PATCH /user/me:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// =========================
// GET buscar usuarios (por username o email)
// Debe ir antes de /:id para que no lo confunda Express
// =========================
router.get('/search', auth, async (req, res) => {
  try {
    const query = req.query.q?.trim() || '';
    if (!query) return res.status(400).json({ message: 'Query vacía' });

    const currentUser = await User.findById(req.user._id).populate('friends', '_id');
    if (!currentUser) return res.status(404).json({ message: 'Usuario no encontrado' });

    const friendsIds = currentUser.friends ? currentUser.friends.map(f => f._id) : [];
    const excludeIds = [currentUser._id, ...friendsIds];

    const users = await User.find({
      _id: { $nin: excludeIds },
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('_id username avatar');

    res.json({ users });
  } catch (err) {
    console.error('Error en GET /users/search:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// =========================
// GET perfil de un usuario por id (con animes)
// =========================
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate({
        path: 'animes.animeId',
        select: 'title image genre rating description',
        options: { lean: true },
      });

    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const filteredAnimes = user.animes
      .filter(a => a.animeId)
      .map(a => {
        const animeObj = a.toObject ? a.toObject() : { ...a };
        if (animeObj.score !== undefined) {
          animeObj.rating = animeObj.score;
          delete animeObj.score;
        }
        return animeObj;
      });

    res.json({ ...user.toJSON(), animes: filteredAnimes });
  } catch (err) {
    console.error('Error en GET /user/:id:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// =========================
// GET my-animes
// =========================
router.get('/my-animes', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'animes.animeId',
        select: 'title image genre rating description',
        options: { lean: true },
      });

    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const filteredAnimes = [];
    for (let i = 0; i < user.animes.length; i++) {
      const a = user.animes[i];
      try {
        if (!a.animeId) continue;
        const animeObj = a.toObject ? a.toObject() : { ...a };
        if (animeObj.score !== undefined) {
          animeObj.rating = animeObj.score;
          delete animeObj.score;
        }
        filteredAnimes.push(animeObj);
      } catch (innerErr) {
        console.error(`Error procesando anime en posición ${i}:`, innerErr, a);
      }
    }

    res.json({ animes: filteredAnimes });
  } catch (err) {
    console.error('Error en GET /my-animes:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// =========================
// POST añadir anime (rating decimal permitido)
// =========================
router.post('/my-animes', auth, async (req, res) => {
  try {
    const { animeId, status = 'plan', rating, notes } = req.body;
    if (!animeId) return res.status(400).json({ message: 'animeId es obligatorio' });

    // Convertir a número para aceptar decimales
    const numericRating = rating !== undefined ? parseFloat(rating) : undefined;
    if (numericRating !== undefined && (isNaN(numericRating) || numericRating < 0 || numericRating > 10)) {
      return res.status(400).json({ message: 'La puntuación debe estar entre 0 y 10' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const exists = user.animes.some(a => a.animeId.toString() === animeId);
    if (exists) return res.status(400).json({ message: 'Anime ya añadido a la lista' });

    const animeExists = await Anime.findById(animeId);
    if (!animeExists) return res.status(404).json({ message: 'Anime no existe en la base de datos' });

    user.animes.push({ animeId, status, rating: numericRating, notes });
    await user.save();

    await user.populate({
      path: 'animes.animeId',
      select: 'title image genre rating description',
      options: { lean: true },
    });

    const filteredAnimes = user.animes
      .filter(a => a.animeId)
      .map(a => {
        const animeObj = a.toObject ? a.toObject() : { ...a };
        if (animeObj.score !== undefined) {
          animeObj.rating = animeObj.score;
          delete animeObj.score;
        }
        return animeObj;
      });

    res.status(201).json({ message: 'Anime añadido', animes: filteredAnimes });
  } catch (err) {
    console.error('Error en POST /my-animes:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// =========================
// PATCH actualizar anime (rating decimal permitido)
// =========================
router.patch('/my-animes/:animeId', auth, async (req, res) => {
  try {
    const { animeId } = req.params;
    const { status, rating, notes } = req.body;

    const numericRating = rating !== undefined ? parseFloat(rating) : undefined;
    if (numericRating !== undefined && (isNaN(numericRating) || numericRating < 0 || numericRating > 10)) {
      return res.status(400).json({ message: 'La puntuación debe estar entre 0 y 10' });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const anime = user.animes.find(a => a.animeId.toString() === animeId);
    if (!anime) return res.status(404).json({ message: 'Anime no encontrado en la lista' });

    if (status) anime.status = status;
    if (numericRating !== undefined) anime.rating = numericRating;
    if (notes !== undefined) anime.notes = notes;

    await user.save();
    await user.populate({
      path: 'animes.animeId',
      select: 'title image genre rating description',
      options: { lean: true },
    });

    const filteredAnimes = user.animes
      .filter(a => a.animeId)
      .map(a => {
        const animeObj = a.toObject ? a.toObject() : { ...a };
        if (animeObj.score !== undefined) {
          animeObj.rating = animeObj.score;
          delete animeObj.score;
        }
        return animeObj;
      });

    res.json({ message: 'Anime actualizado', animes: filteredAnimes });
  } catch (err) {
    console.error('Error en PATCH /my-animes/:animeId:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// =========================
// PATCH toggle favorite
// =========================
router.patch('/favorite/:animeId', auth, async (req, res) => {
  try {
    const { animeId } = req.params;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const entry = user.animes.find(a => {
      if (!a.animeId) return false;
      const aid = a.animeId.toString ? a.animeId.toString() : a.animeId;
      return aid === animeId;
    });

    if (!entry) return res.status(404).json({ message: 'Anime no encontrado en la lista del usuario' });

    entry.favorite = !entry.favorite;
    await user.save();

    res.json({ message: 'Favorite toggled', animeId, favorite: entry.favorite });
  } catch (err) {
    console.error('Error toggling favorite:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// =========================
// DELETE eliminar anime
// =========================
router.delete('/my-animes/:animeId', auth, async (req, res) => {
  try {
    const { animeId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const index = user.animes.findIndex(a => a.animeId.toString() === animeId);
    if (index === -1) return res.status(404).json({ message: 'Anime no encontrado en la lista' });

    user.animes.splice(index, 1);
    await user.save();

    await user.populate({
      path: 'animes.animeId',
      select: 'title image genre rating description',
      options: { lean: true },
    });

    const filteredAnimes = user.animes
      .filter(a => a.animeId)
      .map(a => {
        const animeObj = a.toObject ? a.toObject() : { ...a };
        if (animeObj.score !== undefined) {
          animeObj.rating = animeObj.score;
          delete animeObj.score;
        }
        return animeObj;
      });

    res.json({ message: 'Anime eliminado', animes: filteredAnimes });
  } catch (err) {
    console.error('Error en DELETE /my-animes/:animeId:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// =========================
// DELETE eliminar cuenta del usuario loggeado y limpiar referencias
// =========================
router.delete('/me', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    await User.updateMany(
      { friends: userId },
      { $pull: { friends: userId } }
    );

    await User.deleteOne({ _id: userId });

    res.json({
      message: 'Cuenta eliminada correctamente y referencias limpiadas. Debes cerrar sesión en el cliente.',
    });
  } catch (err) {
    console.error('Error en DELETE /user/me:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
