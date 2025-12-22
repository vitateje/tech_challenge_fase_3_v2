"""
Templates de Prompts para Fine-Tuning Médico

Este módulo contém os templates de prompts usados durante o fine-tuning
e inferência do modelo médico. O formato Alpaca é amplamente adotado
porque oferece uma estrutura clara e consistente para modelos LLM.
"""

# ============================================================================
# PROMPT ALPACA ADAPTADO PARA MEDICINA
# ============================================================================
# Este prompt segue o formato Alpaca, mas foi adaptado especificamente
# para tarefas de question-answering médico baseado em evidências.
#
# Estrutura do prompt:
#   - Instruction: Descreve a tarefa médica
#   - Input: Contém contexto científico e pergunta
#   - Response: Resposta esperada baseada em evidências
#
# Por que usar este formato?
#   1. Compatível com modelos pré-treinados (LLaMA, Mistral, etc.)
#   2. Estrutura clara que ajuda o modelo a entender a tarefa
#   3. Padrão amplamente usado na comunidade (Alpaca dataset)
#   4. Facilita o fine-tuning com bibliotecas como Unsloth, TRL

MEDICAL_ALPACA_PROMPT = """Below is a medical instruction that describes a task, paired with medical context and a question. Write a response that appropriately completes the request based on the provided medical evidence.

### Instruction:
{}

### Input:
{}

### Response:
{}"""


def get_medical_alpaca_prompt(instruction: str, input_text: str, response: str = "") -> str:
    """
    Formata um prompt médico usando o template Alpaca
    
    Esta função é usada durante:
    - Fine-tuning: Para formatar exemplos de treinamento
    - Inferência: Para formatar perguntas para o modelo treinado
    
    Args:
        instruction: Instrução médica (ex: "Responda à pergunta baseando-se nos contextos")
        input_text: Contexto médico + pergunta
        response: Resposta esperada (vazio durante inferência)
        
    Returns:
        String formatada com o prompt completo
        
    Exemplo de uso durante treinamento:
        prompt = get_medical_alpaca_prompt(
            instruction="Responda à pergunta baseando-se nos contextos fornecidos",
            input_text="Contexto: ...\nPergunta: Qual o tratamento para hipertensão?",
            response="O tratamento inclui..."
        )
        
    Exemplo de uso durante inferência:
        prompt = get_medical_alpaca_prompt(
            instruction="Responda à pergunta baseando-se nos contextos fornecidos",
            input_text="Contexto: ...\nPergunta: Qual o tratamento para hipertensão?",
            response=""  # Vazio durante inferência
        )
    """
    return MEDICAL_ALPACA_PROMPT.format(instruction, input_text, response)


def get_instruction_only() -> str:
    """
    Retorna apenas a instrução padrão para tarefas médicas
    
    Útil quando você quer usar a mesma instrução em múltiplos exemplos
    durante o fine-tuning.
    
    Returns:
        String com a instrução padrão
    """
    return "Responda à pergunta baseando-se nos contextos fornecidos."


# ============================================================================
# PROMPT ALTERNATIVO (para referência futura)
# ============================================================================
# Caso queira experimentar com outros formatos de prompt, você pode
# adicionar aqui. Alguns formatos alternativos incluem:
#
# - ChatML format (usado por alguns modelos)
# - Vicuna format
# - Custom medical format

CHATML_MEDICAL_PROMPT = """<|im_start|>system
You are a medical assistant that answers questions based on scientific evidence.
<|im_end|>
<|im_start|>user
Instruction: {}
Input: {}
<|im_end|>
<|im_start|>assistant
{}<|im_end|>"""


def get_chatml_medical_prompt(instruction: str, input_text: str, response: str = "") -> str:
    """
    Formata prompt no formato ChatML (alternativa ao Alpaca)
    
    Nota: Este formato pode ser útil para modelos específicos que foram
    treinados com ChatML. Por padrão, usamos Alpaca por ser mais universal.
    
    Args:
        instruction: Instrução médica
        input_text: Contexto + pergunta
        response: Resposta esperada
        
    Returns:
        String formatada no formato ChatML
    """
    return CHATML_MEDICAL_PROMPT.format(instruction, input_text, response)

