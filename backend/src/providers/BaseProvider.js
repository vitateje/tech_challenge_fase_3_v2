class BaseProvider {
  constructor(config) {
    this.config = config;
    this.name = config.name;
    this.type = config.type;
  }

  async initialize() {
    throw new Error('initialize() deve ser implementado pelo provider');
  }

  async generate(prompt, options = {}) {
    throw new Error('generate() deve ser implementado pelo provider');
  }

  isAvailable() {
    throw new Error('isAvailable() deve ser implementado pelo provider');
  }
}

module.exports = BaseProvider;

