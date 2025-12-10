const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const User = require("../models/User");
const FriendRequest = require("../models/FriendRequest");
const auth = require("../middlewares/auth");

// -------------------------------
// Enviar solicitud de amistad
// -------------------------------
router.post("/request", auth, async (req, res) => {
  try {
    const toUserId = req.body.toUserId;

    if (!toUserId) {
      return res.status(400).json({ success: false, message: "toUserId requerido" });
    }

    const fromUserId = new mongoose.Types.ObjectId(req.user._id);
    const recipientId = new mongoose.Types.ObjectId(toUserId);

    if (fromUserId.equals(recipientId)) {
      return res.status(400).json({
        success: false,
        message: "No puedes enviarte solicitud a ti mismo"
      });
    }

    // Verificar si el usuario destino existe
    const destUser = await User.findById(recipientId);
    if (!destUser) {
      return res.status(404).json({ success: false, message: "Usuario destinatario no encontrado" });
    }

    // Ya existe solicitud pendiente
    const exist = await FriendRequest.findOne({
      from: fromUserId,
      to: recipientId,
      status: "pending"
    });

    if (exist) {
      return res.status(400).json({ success: false, message: "Solicitud ya enviada anteriormente" });
    }

    // Solicitud inversa pendiente
    const reverse = await FriendRequest.findOne({
      from: recipientId,
      to: fromUserId,
      status: "pending"
    });

    if (reverse) {
      return res.status(400).json({
        success: false,
        message: "Este usuario ya te envió una solicitud pendiente"
      });
    }

    // Ya son amigos
    const me = await User.findById(fromUserId);
    if (me.friends.includes(recipientId)) {
      return res.status(400).json({ success: false, message: "Ya sois amigos" });
    }

    const request = new FriendRequest({
      from: fromUserId,
      to: recipientId
    });

    await request.save();

    res.status(201).json({
      success: true,
      message: "Solicitud enviada correctamente",
      request
    });
  } catch (err) {
    console.error("Error en POST /request:", err);
    res.status(500).json({ success: false, message: "Error del servidor" });
  }
});

// -------------------------------
// Aceptar solicitud
// -------------------------------
router.patch("/accept/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const request = await FriendRequest.findById(id);

    if (!request)
      return res.status(404).json({ success: false, message: "Solicitud no encontrada" });

    const userId = new mongoose.Types.ObjectId(req.user._id);

    if (!request.to.equals(userId))
      return res.status(403).json({ success: false, message: "No autorizado" });

    request.status = "accepted";
    await request.save();

    // añadir amistad mutua
    await User.findByIdAndUpdate(userId, { $addToSet: { friends: request.from } });
    await User.findByIdAndUpdate(request.from, { $addToSet: { friends: userId } });

    res.json({ success: true, message: "Solicitud aceptada", request });
  } catch (err) {
    console.error("Error en PATCH /accept/:id:", err);
    res.status(500).json({ success: false, message: "Error del servidor" });
  }
});

// -------------------------------
// Rechazar solicitud
// -------------------------------
router.delete("/reject/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const request = await FriendRequest.findById(id);

    if (!request)
      return res.status(404).json({ success: false, message: "Solicitud no encontrada" });

    const userId = new mongoose.Types.ObjectId(req.user._id);

    if (!request.to.equals(userId))
      return res.status(403).json({ success: false, message: "No autorizado" });

    request.status = "rejected";
    await request.save();

    res.json({ success: true, message: "Solicitud rechazada", request });
  } catch (err) {
    console.error("Error en DELETE /reject/:id:", err);
    res.status(500).json({ success: false, message: "Error del servidor" });
  }
});

// -------------------------------
// Obtener lista de amigos
// -------------------------------
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("friends", "username email avatar");

    res.json({
      success: true,
      friends: user.friends  // <-- CORREGIDO
    });
  } catch (err) {
    console.error("Error en GET /friends:", err);
    res.status(500).json({ success: false, message: "Error del servidor" });
  }
});

// -------------------------------
// Solicitudes pendientes recibidas
// -------------------------------
router.get("/requests", auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const requests = await FriendRequest.find({
      to: userId,
      status: "pending",
    })
      .populate("from", "username email avatar")
      .sort({ createdAt: -1 });

    res.json({ success: true, pendingRequests: requests });
  } catch (err) {
    console.error("Error en GET /requests:", err);
    res.status(500).json({ success: false, message: "Error del servidor" });
  }
});

// -------------------------------
// Solicitudes enviadas
// -------------------------------
router.get("/sent-requests", auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const sent = await FriendRequest.find({
      from: userId,
      status: "pending",
    })
      .populate("to", "username email avatar")
      .sort({ createdAt: -1 });

    res.json({ success: true, sentRequests: sent });
  } catch (err) {
    console.error("Error en GET /sent-requests:", err);
    res.status(500).json({ success: false, message: "Error del servidor" });
  }
});

module.exports = router;
