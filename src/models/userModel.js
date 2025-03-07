// src/models/userModel.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Por favor ingrese su nombre'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Por favor ingrese su correo electrónico'],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Por favor ingrese un correo electrónico válido',
      ],
    },
    password: {
      type: String,
      required: [true, 'Por favor ingrese una contraseña'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
      select: false, // No incluir en las consultas
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Por favor confirme su contraseña'],
      validate: {
        // Solo funciona para CREATE y SAVE
        validator: function (el) {
          return el === this.password;
        },
        message: 'Las contraseñas no coinciden',
      },
    },
    role: {
      type: String,
      enum: ['user', 'staff', 'admin'],
      default: 'user',
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
    },
    phone: String,
    passwordChangedAt: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Middleware para encriptar contraseña antes de guardar
userSchema.pre('save', async function (next) {
  // Solo ejecutar si la contraseña fue modificada
  if (!this.isModified('password')) return next();

  // Hash de la contraseña con costo de 12
  this.password = await bcrypt.hash(this.password, 12);

  // Eliminar passwordConfirm
  this.passwordConfirm = undefined;
  next();
});

// Middleware para actualizar passwordChangedAt
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  // Restar 1 segundo para asegurar que el token sea creado después del cambio de contraseña
  this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Método para comparar contraseñas
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Método para verificar si la contraseña cambió después de emitir el token
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Método para generar token JWT
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const User = mongoose.model('User', userSchema);

module.exports = User;