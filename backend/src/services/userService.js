const userRepository = require('../repositories/userRepository');

class UserService {
  async getAllUsers() {
    return await userRepository.getAll();
  }

  async getUserById(id) {
    return await userRepository.getById(id);
  }

  async getUserByEmail(email) {
    return await userRepository.getByEmail(email);
  }

  async createUser(userData) {
    // Check if user already exists
    const existingUser = await userRepository.getByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    return await userRepository.create(userData);
  }

  async updateUser(id, userData) {
    const user = await userRepository.getById(id);
    if (!user) {
      throw new Error('User not found');
    }

    return await userRepository.update(id, userData);
  }

  async deleteUser(id) {
    const user = await userRepository.getById(id);
    if (!user) {
      throw new Error('User not found');
    }

    return await userRepository.remove(id);
  }

  async updateUserLevel(id, level) {
    return await userRepository.update(id, { level });
  }

  async updateUserInterests(id, interests) {
    return await userRepository.update(id, { interests });
  }
}

module.exports = new UserService();
