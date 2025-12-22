"""
Script de processamento de dados médicos para fine-tuning
Processa o dataset ori_pqal.json e gera dados formatados para treinamento
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Any


def anonymize_text(text: str) -> str:
    """
    Anonimiza texto removendo padrões que possam identificar pacientes
    
    Args:
        text: Texto a ser anonimizado
        
    Returns:
        Texto anonimizado com placeholders genéricos
    """
    if not isinstance(text, str):
        return text
    
    # Remove datas no formato DD/MM/YYYY ou MM/DD/YYYY
    text = re.sub(r'\d{1,2}/\d{1,2}/\d{4}', '[DATA]', text)
    text = re.sub(r'\d{4}-\d{2}-\d{2}', '[DATA]', text)
    
    # Remove IDs numéricos longos (possíveis IDs de pacientes)
    text = re.sub(r'ID:\s*\d+', 'ID: [PACIENTE_ID]', text, flags=re.IGNORECASE)
    text = re.sub(r'Patient ID:\s*\d+', 'Patient ID: [PACIENTE_ID]', text, flags=re.IGNORECASE)
    
    # Remove números de telefone
    text = re.sub(r'\d{3}[-.]?\d{3}[-.]?\d{4}', '[TELEFONE]', text)
    
    # Remove emails
    text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]', text)
    
    return text


def load_medical_dataset(file_path: str) -> Dict[str, Any]:
    """
    Carrega o dataset médico do arquivo JSON
    
    Args:
        file_path: Caminho para o arquivo ori_pqal.json
        
    Returns:
        Dicionário com os dados médicos
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def prepare_medical_instruction(data_id: str, content: Dict[str, Any]) -> Dict[str, str]:
    """
    Prepara uma entrada do dataset no formato de instrução para fine-tuning
    
    Args:
        data_id: ID único da entrada
        content: Conteúdo médico com QUESTION, CONTEXTS, LONG_ANSWER, etc.
        
    Returns:
        Dicionário com id e input formatado
    """
    question = content.get("QUESTION", "")
    contexts = content.get("CONTEXTS", [])
    long_answer = content.get("LONG_ANSWER", "")
    meshes = content.get("MESHES", [])
    
    # Une os contextos em um único bloco de texto
    context_str = " ".join(contexts)
    
    # Adiciona termos MESH como metadados
    meshes_str = ", ".join(meshes) if meshes else ""
    
    # Formata o prompt no estilo usado nos notebooks de referência
    formatted_input = (
        f"INSTRUÇÃO MÉDICA: Responda à pergunta baseando-se nos contextos fornecidos.\n"
        f"[|Contexto|] {anonymize_text(context_str)}[|eContexto|]\n"
    )
    
    if meshes_str:
        formatted_input += f"[|Termos|] {meshes_str}[|eTermos|]\n"
    
    formatted_input += (
        f"[|Pergunta|] {question}[|ePergunta|]\n\n"
        f"[|Resposta|]{anonymize_text(long_answer)}[|eResposta|]"
    )
    
    return {
        "id": data_id,
        "input": formatted_input
    }


def process_full_pipeline(input_file: str, output_file: str) -> int:
    """
    Executa o pipeline completo de processamento
    
    Args:
        input_file: Caminho para o arquivo ori_pqal.json
        output_file: Caminho para salvar o dataset processado
        
    Returns:
        Número de entradas processadas com sucesso
    """
    print(f"Carregando dataset de: {input_file}")
    raw_data = load_medical_dataset(input_file)
    
    print(f"Iniciando processamento de {len(raw_data)} entradas médicas...")
    processed_data = []
    
    for data_id, content in raw_data.items():
        try:
            entry = prepare_medical_instruction(data_id, content)
            processed_data.append(entry)
        except Exception as e:
            print(f"Erro ao processar entrada {data_id}: {e}")
            continue
    
    print(f"Salvando dataset processado em: {output_file}")
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(processed_data, f, indent=2, ensure_ascii=False)
    
    print(f"Dataset preparado com sucesso!")
    print(f"Total de entradas processadas: {len(processed_data)}")
    
    return len(processed_data)


if __name__ == "__main__":
    # Caminhos padrão
    input_file = '../context/pubmedqa-master/data/ori_pqal.json'
    output_file = 'medical_tuning_data.json'
    
    # Verifica se o arquivo de entrada existe
    if not Path(input_file).exists():
        print(f"Erro: Arquivo não encontrado: {input_file}")
        print("Por favor, verifique o caminho do arquivo.")
        exit(1)
    
    # Executa o processamento
    process_full_pipeline(input_file, output_file)

