const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido']
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false // Não retornar senha por padrão
  },

  // Medical Staff Information
  role: {
    type: String,
    enum: ['doctor', 'nurse', 'admin', 'specialist', 'student'],
    default: 'doctor'
  },

  specialty: {
    type: String,
    trim: true
    // Examples: 'Cardiology', 'Emergency Medicine', 'Surgery', etc.
  },

  licenseNumber: {
    type: String,
    trim: true,
    sparse: true,
    unique: true
    // Medical license number (CRM, COREN, etc.)
  },

  // Department/Unit
  department: {
    type: String,
    trim: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'users',
  timestamps: true
});

// Hash da senha antes de salvar
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar senha
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método toJSON customizado (remover senha)
UserSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', UserSchema);
