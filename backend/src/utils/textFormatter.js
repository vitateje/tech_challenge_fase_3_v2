/**
 * Utilitário para formatar respostas do chat
 * Melhora a legibilidade e organização visual das mensagens
 */

class TextFormatter {
    /**
     * Formata uma resposta do chat para melhor legibilidade
     * @param {string} text - Texto a ser formatado
     * @returns {string} - Texto formatado com quebras de linha e estrutura
     */
    formatResponse(text) {
        if (!text || typeof text !== 'string') {
            return text;
        }

        let formatted = text;

        // 1. Adicionar quebras de linha após marcadores de seção
        formatted = this.formatSections(formatted);

        // 2. Formatar listas e enumerações
        formatted = this.formatLists(formatted);

        // 3. Formatar destaques (negrito, itálico)
        formatted = this.formatEmphasis(formatted);

        // 4. Adicionar espaçamento entre parágrafos
        formatted = this.formatParagraphs(formatted);

        // 5. Formatar exemplos e código
        formatted = this.formatExamples(formatted);

        return formatted.trim();
    }

    /**
     * Formata seções com títulos
     */
    formatSections(text) {
        // Detectar padrões como "**Título:**" ou "🔬 Título:"
        let formatted = text;

        // Adicionar quebra de linha antes de títulos em negrito
        formatted = formatted.replace(/(\*\*[^*]+:\*\*)/g, '\n\n$1');

        // Adicionar quebra de linha antes de emojis seguidos de texto
        formatted = formatted.replace(/([\u{1F300}-\u{1F9FF}][\s]*[A-Z][^:]*:)/gu, '\n\n$1');

        return formatted;
    }

    /**
     * Formata listas numeradas e com marcadores
     */
    formatLists(text) {
        let formatted = text;

        // Listas numeradas: "1. Item" -> "\n1. Item"
        formatted = formatted.replace(/([.!?])\s+(\d+\.\s+)/g, '$1\n\n$2');

        // Listas com marcadores: "- Item" ou "• Item"
        formatted = formatted.replace(/([.!?])\s+([-•]\s+)/g, '$1\n\n$2');

        // Adicionar quebra entre itens de lista consecutivos
        formatted = formatted.replace(/(\d+\.\s+[^\n]+)(\s+)(\d+\.\s+)/g, '$1\n$3');
        formatted = formatted.replace(/([-•]\s+[^\n]+)(\s+)([-•]\s+)/g, '$1\n$3');

        return formatted;
    }

    /**
     * Formata ênfases (negrito, itálico)
     */
    formatEmphasis(text) {
        // Manter marcadores de ênfase como estão (Markdown)
        // O frontend pode renderizar esses marcadores
        return text;
    }

    /**
     * Adiciona espaçamento adequado entre parágrafos
     */
    formatParagraphs(text) {
        let formatted = text;

        // Detectar fim de frases seguidas de nova frase (sem quebra de linha)
        // Adicionar quebra de linha dupla entre parágrafos conceituais
        formatted = formatted.replace(/([.!?])\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ])/g, '$1\n\n$2');

        // Remover múltiplas quebras de linha consecutivas (max 2)
        formatted = formatted.replace(/\n{3,}/g, '\n\n');

        return formatted;
    }

    /**
     * Formata exemplos, fórmulas químicas e código
     */
    formatExamples(text) {
        let formatted = text;

        // Adicionar quebra de linha antes de "Exemplo:" ou "Ex:"
        formatted = formatted.replace(/([.!?])\s+(Exemplo|Ex|Exemplos):/gi, '$1\n\n$2:');

        // Adicionar quebra de linha antes de "Dica:" ou "Curiosidade:"
        formatted = formatted.replace(/([.!?])\s+(Dica|Curiosidade|Importante|Atenção):/gi, '$1\n\n$2:');

        // Formatar fórmulas químicas em destaque (já com subscript)
        // Ex: H₂O, CO₂, etc. (manter como está)

        return formatted;
    }

    /**
     * Formata perguntas reflexivas
     */
    formatQuestions(text) {
        let formatted = text;

        // Adicionar quebra de linha antes de perguntas
        formatted = formatted.replace(/([.!])\s+(O que você|Como você|Por que você|Você consegue|Quer que)/gi, '$1\n\n$2');

        return formatted;
    }

    /**
     * Limpa formatação excessiva
     */
    cleanFormatting(text) {
        let cleaned = text;

        // Remover espaços múltiplos
        cleaned = cleaned.replace(/  +/g, ' ');

        // Remover espaços no início de linhas
        cleaned = cleaned.replace(/\n +/g, '\n');

        // Remover espaços no final de linhas
        cleaned = cleaned.replace(/ +\n/g, '\n');

        return cleaned;
    }

    /**
     * Formata resposta completa (aplica todas as regras)
     */
    formatComplete(text) {
        if (!text || typeof text !== 'string') {
            return text;
        }

        let formatted = text;

        // Aplicar formatações em ordem
        formatted = this.formatSections(formatted);
        formatted = this.formatLists(formatted);
        formatted = this.formatParagraphs(formatted);
        formatted = this.formatExamples(formatted);
        formatted = this.formatQuestions(formatted);
        formatted = this.cleanFormatting(formatted);

        return formatted.trim();
    }

    /**
     * Converte texto para HTML com formatação Markdown básica
     * (Opcional - para uso no frontend)
     */
    toHTML(text) {
        if (!text || typeof text !== 'string') {
            return text;
        }

        let html = text;

        // Converter quebras de linha para <br>
        html = html.replace(/\n/g, '<br>');

        // Converter negrito **texto** para <strong>
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

        // Converter itálico *texto* para <em>
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

        // Converter listas
        // (Implementação básica - pode ser expandida)

        return html;
    }
}

module.exports = new TextFormatter();
