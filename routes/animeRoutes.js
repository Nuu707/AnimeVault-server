const express = require('express');
const router = express.Router();
const Anime = require('../models/Anime');
const User = require('../models/User');
const auth = require('../middlewares/auth');

// =========================
//     RUTAS PÚBLICAS
// =========================

// GET todos los animes
router.get('/', async (req, res) => {
  try {
    const animes = await Anime.find();
    res.json(animes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener animes' });
  }
});

// GET un anime por ID
router.get('/:id', async (req, res) => {
  try {
    const anime = await Anime.findById(req.params.id);
    if (!anime) return res.status(404).json({ message: "Anime no encontrado" });
    res.json(anime);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener anime' });
  }
});

// POST crear anime
router.post('/', async (req, res) => {
  try {
    const newAnime = new Anime(req.body);
    const savedAnime = await newAnime.save();
    res.status(201).json(savedAnime);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error al crear anime' });
  }
});

// PUT actualizar anime
router.put('/:id', async (req, res) => {
  try {
    const updatedAnime = await Anime.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedAnime) return res.status(404).json({ message: "Anime no encontrado" });
    res.json(updatedAnime);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Error al actualizar anime' });
  }
});

// DELETE eliminar anime
router.delete('/:id', async (req, res) => {
  try {
    const deletedAnime = await Anime.findByIdAndDelete(req.params.id);
    if (!deletedAnime) return res.status(404).json({ message: "Anime no encontrado" });
    res.json({ message: "Anime eliminado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar anime' });
  }
});

// =========================
//     RUTAS PROTEGIDAS - MY ANIMES
// =========================

// POST añadir anime a la lista del usuario
router.post('/my-animes', auth, async (req, res) => {
  try {
    const { animeId, status = 'plan', favorite = false } = req.body;
    if (!animeId) return res.status(400).json({ message: "animeId es obligatorio" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const exists = user.animes.some(a => a.animeId.toString() === animeId);
    if (exists) return res.status(400).json({ message: "Anime ya está en tu lista" });

    const animeExists = await Anime.findById(animeId);
    if (!animeExists) return res.status(404).json({ message: "Anime no existe en la base de datos" });

    user.animes.push({ animeId, status, favorite });
    await user.save();

    res.status(201).json({
      message: "Anime añadido a tu lista",
      animes: user.animes
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al añadir anime a la lista' });
  }
});

// PATCH actualizar estado o favorito
router.patch('/my-animes/:animeId', auth, async (req, res) => {
  try {
    const { animeId } = req.params;
    const { status, favorite } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const animeEntry = user.animes.find(a => a.animeId.toString() === animeId);
    if (!animeEntry) return res.status(404).json({ message: "Anime no encontrado en tu lista" });

    if (status) animeEntry.status = status;
    if (favorite !== undefined) animeEntry.favorite = favorite;

    await user.save();
    res.json({ message: "Anime actualizado", anime: animeEntry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al actualizar anime en la lista' });
  }
});

// DELETE eliminar anime de la lista del usuario
router.delete('/my-animes/:animeId', auth, async (req, res) => {
  try {
    const { animeId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const index = user.animes.findIndex(a => a.animeId.toString() === animeId);
    if (index === -1) return res.status(404).json({ message: "Anime no encontrado en tu lista" });

    user.animes.splice(index, 1);
    await user.save();

    res.json({
      message: "Anime eliminado de tu lista",
      animes: user.animes
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al eliminar anime de la lista' });
  }
});

module.exports = router;
