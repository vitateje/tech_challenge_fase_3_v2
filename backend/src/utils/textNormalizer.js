// Utilitário para normalização de texto (remover acentos, normalizar espaços, etc)

/**
 * Remove acentos de uma string
 * @param {string} str - String a ser normalizada
 * @returns {string} String sem acentos
 */
function removeAccents(str) {
  if (!str) return '';
  
  const accents = {
    'á': 'a', 'à': 'a', 'ã': 'a', 'â': 'a', 'ä': 'a',
    'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
    'í': 'i', 'ì': 'i', 'î': 'i', 'ï': 'i',
    'ó': 'o', 'ò': 'o', 'õ': 'o', 'ô': 'o', 'ö': 'o',
    'ú': 'u', 'ù': 'u', 'û': 'u', 'ü': 'u',
    'ç': 'c',
    'Á': 'A', 'À': 'A', 'Ã': 'A', 'Â': 'A', 'Ä': 'A',
    'É': 'E', 'È': 'E', 'Ê': 'E', 'Ë': 'E',
    'Í': 'I', 'Ì': 'I', 'Î': 'I', 'Ï': 'I',
    'Ó': 'O', 'Ò': 'O', 'Õ': 'O', 'Ô': 'O', 'Ö': 'O',
    'Ú': 'U', 'Ù': 'U', 'Û': 'U', 'Ü': 'U',
    'Ç': 'C'
  };
  
  return str.replace(/[áàãâäéèêëíìîïóòõôöúùûüçÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇ]/g, 
    (char) => accents[char] || char
  );
}

/**
 * Normaliza uma string para busca (remove acentos, converte para minúsculas, remove espaços extras)
 * @param {string} str - String a ser normalizada
 * @returns {string} String normalizada
 */
function normalizeForSearch(str) {
  if (!str) return '';
  
  return removeAccents(str)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' '); // Remove múltiplos espaços
}

/**
 * Remove plural de palavras em português (tentativa simples)
 * @param {string} word - Palavra a ser processada
 * @returns {string} Palavra sem plural
 */
function removePlural(word) {
  if (!word || word.length < 3) return word;
  
  // Regras básicas de plural em português
  if (word.endsWith('ões')) {
    return word.slice(0, -3) + 'ão'; // reações -> reação
  }
  if (word.endsWith('ais') || word.endsWith('eis') || word.endsWith('ois')) {
    return word.slice(0, -2) + 'l'; // elementos -> elemento
  }
  if (word.endsWith('s') && word.length > 3) {
    // Remove 's' final, mas preserva palavras terminadas em 'ns', 'ls', etc
    if (!word.endsWith('ns') && !word.endsWith('ls') && !word.endsWith('rs')) {
      return word.slice(0, -1);
    }
  }
  
  return word;
}

/**
 * Extrai palavras-chave de uma pergunta, normalizadas
 * @param {string} question - Pergunta a ser processada
 * @returns {string[]} Array de palavras-chave normalizadas
 */
function extractKeywords(question) {
  if (!question) return [];
  
  const normalized = normalizeForSearch(question);
  const words = normalized.split(/\s+/);
  
  // Remove palavras comuns (stop words)
  const stopWords = ['o', 'a', 'os', 'as', 'de', 'do', 'da', 'dos', 'das', 
                     'em', 'no', 'na', 'nos', 'nas', 'para', 'com', 'que', 
                     'é', 'são', 'foi', 'ser', 'ter', 'há', 'tem', 'como',
                     'qual', 'quais', 'quando', 'onde', 'por', 'porque'];
  
  const keywords = words
    .filter(word => word.length > 2 && !stopWords.includes(word))
    .map(word => removePlural(word));
  
  return keywords;
}

/**
 * Verifica se uma string contém outra (tolerante a acentos e variações)
 * @param {string} text - Texto onde buscar
 * @param {string} search - Termo a buscar
 * @returns {boolean} true se encontrar
 */
function containsNormalized(text, search) {
  const normalizedText = normalizeForSearch(text);
  const normalizedSearch = normalizeForSearch(search);
  
  return normalizedText.includes(normalizedSearch);
}

/**
 * Busca normalizada em um objeto de conhecimento
 * @param {Object} knowledgeBase - Base de conhecimento { chave: resposta }
 * @param {string} query - Termo de busca
 * @returns {string|null} Resposta encontrada ou null
 */
function searchKnowledgeBase(knowledgeBase, query) {
  const normalizedQuery = normalizeForSearch(query);
  const keywords = extractKeywords(query);
  
  // Primeira tentativa: busca exata normalizada
  for (const [key, answer] of Object.entries(knowledgeBase)) {
    if (containsNormalized(query, key) || containsNormalized(key, normalizedQuery)) {
      return answer;
    }
  }
  
  // Segunda tentativa: busca por palavras-chave
  for (const keyword of keywords) {
    for (const [key, answer] of Object.entries(knowledgeBase)) {
      const normalizedKey = normalizeForSearch(key);
      if (normalizedKey.includes(keyword) || keyword.includes(normalizedKey)) {
        return answer;
      }
    }
  }
  
  return null;
}

module.exports = {
  removeAccents,
  normalizeForSearch,
  removePlural,
  extractKeywords,
  containsNormalized,
  searchKnowledgeBase
};
