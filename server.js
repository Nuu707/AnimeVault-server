const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Para usar variables de entorno

// Importar rutas
const animeRoutes = require('./routes/animeRoutes');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const friendsRoutes = require('./routes/friendsRoutes');
const contactRoutes = require('./routes/contactRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json()); // Para leer JSON en peticiones POST

// Conexión a MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB conectado correctamente'))
.catch(err => console.log('Error de conexión:', err));

// Rutas
app.use('/api/animes', animeRoutes);       // Animes públicos
app.use('/api/auth', authRoutes);          // Registro/Login
app.use('/api/user', userRoutes);          // My Animes / perfil usuario
app.use('/api/friends', friendsRoutes);    // Amigos
app.use('/api/contact', contactRoutes);    // Contacto

// Inicio del servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
