const User = require('../models/User');

async function getAll() {
  try {
    const users = await User.find().select('-password');
    return users;
  } catch (error) {
    throw new Error(`Erro ao buscar usuários: ${error.message}`);
  }
}

async function getById(id) {
  try {
    const user = await User.findById(id).select('-password');
    return user;
  } catch (error) {
    throw new Error(`Erro ao buscar usuário: ${error.message}`);
  }
}

async function getByEmail(email) {
  try {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    return user;
  } catch (error) {
    throw new Error(`Erro ao buscar usuário por email: ${error.message}`);
  }
}

async function create(data) {
  try {
    const user = new User(data);
    await user.save();
    return user.toJSON();
  } catch (error) {
    if (error.code === 11000) {
      throw new Error('Email já cadastrado');
    }
    throw new Error(`Erro ao criar usuário: ${error.message}`);
  }
}

async function update(id, updates) {
  try {
    const user = await User.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return null;
    }
    
    return user;
  } catch (error) {
    throw new Error(`Erro ao atualizar usuário: ${error.message}`);
  }
}

async function remove(id) {
  try {
    const result = await User.findByIdAndDelete(id);
    return !!result;
  } catch (error) {
    throw new Error(`Erro ao remover usuário: ${error.message}`);
  }
}

module.exports = { getAll, getById, getByEmail, create, update, remove };
