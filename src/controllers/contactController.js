const nodemailer = require('nodemailer');

const sendContactEmail = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    // Configurar transporte de Nodemailer (Gmail)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Contenido del email
    const mailOptions = {
      from: `"AnimeTrack Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Te lo envías a ti mismo
      subject: `Nuevo mensaje de contacto de ${name}`,
      text: `
Nombre: ${name}
Email: ${email}
Mensaje:
${message}
      `,
    };

    // Enviar email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Mensaje enviado correctamente" });

  } catch (error) {
    console.error("Error al enviar email:", error);
    res.status(500).json({ message: "Error al enviar el mensaje" });
  }
};

module.exports = { sendContactEmail };
