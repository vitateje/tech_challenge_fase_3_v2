"""
Templates de Prompts para Fine-Tuning Médico

Este módulo contém os templates de prompts usados durante o fine-tuning
e inferência do modelo médico usando formato ChatML.
"""

# Template ChatML para tarefas médicas
MEDICAL_CHATML_PROMPT = """<|im_start|>system
You are a medical assistant that answers questions based on scientific evidence.
<|im_end|>
<|im_start|>user
Instruction: {}
Input: {}
<|im_end|>
<|im_start|>assistant
{}<|im_end|>"""


def get_medical_prompt(instruction: str, input_text: str, response: str = "") -> str:
    """
    Formata um prompt médico usando o template ChatML
    
    Args:
        instruction: Instrução médica (ex: "Responda à pergunta baseando-se nos contextos")
        input_text: Contexto médico + pergunta
        response: Resposta esperada (vazio durante inferência)
        
    Returns:
        String formatada com o prompt completo
        
    Exemplo durante treinamento:
        prompt = get_medical_prompt(
            instruction="Responda à pergunta baseando-se nos contextos fornecidos",
            input_text="Contexto: ...\nPergunta: Qual o tratamento para hipertensão?",
            response="O tratamento inclui..."
        )
        
    Exemplo durante inferência:
        prompt = get_medical_prompt(
            instruction="Responda à pergunta baseando-se nos contextos fornecidos",
            input_text="Contexto: ...\nPergunta: Qual o tratamento para hipertensão?",
            response=""
        )
    """
    return MEDICAL_CHATML_PROMPT.format(instruction, input_text, response)


def get_instruction_only() -> str:
    """
    Retorna apenas a instrução padrão para tarefas médicas
    
    Returns:
        String com a instrução padrão
    """
    return "Responda à pergunta baseando-se nos contextos fornecidos."
