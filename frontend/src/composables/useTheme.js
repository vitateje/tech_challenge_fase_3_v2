import { ref } from 'vue';

const isDarkMode = ref(false);

// Carregar preferência do localStorage ou usar preferência do sistema
function loadTheme() {
  if (typeof window === 'undefined') return;
  
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    isDarkMode.value = savedTheme === 'dark';
  } else {
    // Verificar preferência do sistema
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    isDarkMode.value = prefersDark;
  }
  applyTheme();
}

// Aplicar tema ao documento
function applyTheme() {
  if (typeof document === 'undefined') return;
  
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark-mode');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark-mode');
    localStorage.setItem('theme', 'light');
  }
}

// Alternar tema
function toggleTheme() {
  isDarkMode.value = !isDarkMode.value;
  applyTheme();
}

// Inicializar tema quando o módulo for carregado
if (typeof window !== 'undefined') {
  loadTheme();
}

export function useTheme() {
  return {
    isDarkMode,
    toggleTheme,
    loadTheme
  };
}

