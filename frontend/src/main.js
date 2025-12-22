import { createApp } from 'vue';
import App from './App.vue';
import axios from 'axios';
import apiConfig from './config/api.js';

// Configurar axios com a URL base da API
axios.defaults.baseURL = apiConfig.baseURL;

createApp(App).mount('#app');
