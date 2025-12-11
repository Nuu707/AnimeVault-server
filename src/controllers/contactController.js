// controllers/contactController.js
const nodemailer = require('nodemailer');

/**
 * @desc    Enviar mensaje de contacto vía email
 * @route   POST /api/contact
 * @access  Public
 */
const sendContactEmail = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // ---------------------- Validación de campos ----------------------
    if (!name || !email || !message) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    // ---------------------- Configuración del transporte ----------------------
    // Usando Gmail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // correo emisor
        pass: process.env.EMAIL_PASS, // contraseña o app password
      },
    });

    // ---------------------- Contenido del email ----------------------
    const mailOptions = {
      from: `"AnimeTrack Contact" <${process.env.EMAIL_USER}>`, // remitente
      to: process.env.EMAIL_USER, // receptor (yo mismo)
      subject: `Nuevo mensaje de contacto de ${name}`,
      text: `
Nombre: ${name}
Email: ${email}
Mensaje:
${message}
      `,
    };

    // ---------------------- Envío del email ----------------------
    await transporter.sendMail(mailOptions);

    // ---------------------- Respuesta exitosa ----------------------
    res.status(200).json({ message: "Mensaje enviado correctamente" });

  } catch (error) {
    console.error("Error al enviar email:", error);
    res.status(500).json({ message: "Error al enviar el mensaje" });
  }
};

module.exports = { sendContactEmail };
