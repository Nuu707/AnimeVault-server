const mongoose = require("mongoose");

const animeSchema = new mongoose.Schema(
  {
    animeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Anime",
      required: true,
    },
    status: {
      type: String,
      enum: ["plan", "watching", "completed", "dropped", "on-hold"],
      default: "plan",
    },
    favorite: { type: Boolean, default: false },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },

  avatar: {
    type: String,
    default: "/assets/profile-pictures/placeholder.png",
  },

  // Lista de animes del usuario
  animes: [animeSchema],

  // Lista de amigos del usuario
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Middleware para actualizar `updatedAt` automáticamente
userSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Quitar password al enviar el JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
