const express = require("express");
const router = express.Router();
const { sendContactEmail } = require("../controllers/contactController");

// =========================
//       RUTA DE CONTACTO
// =========================

/**
 * @route   POST /api/contact
 * @desc    Enviar mensaje de contacto por email
 */
router.post("/", sendContactEmail);

module.exports = router;
