#!/usr/bin/env python3
"""
Script principal para executar o pipeline completo de preparação de dados
"""

import sys
from pathlib import Path
from data_processor import process_full_pipeline
from validate_data import validate_dataset, print_validation_report


def main():
    """Executa o pipeline completo: processamento + validação"""
    print("=" * 80)
    print("PIPELINE DE PREPARAÇÃO DE DADOS MÉDICOS PARA FINE-TUNING")
    print("=" * 80)
    print()
    
    # Caminhos
    input_file = '../context/pubmedqa-master/data/ori_pqal.json'
    output_file = 'medical_tuning_data.json'
    
    # Verifica arquivo de entrada
    if not Path(input_file).exists():
        print(f"❌ Erro: Arquivo não encontrado: {input_file}")
        print("Por favor, verifique o caminho do arquivo.")
        sys.exit(1)
    
    # Etapa 1: Processamento
    print("📦 ETAPA 1: Processamento de Dados")
    print("-" * 80)
    try:
        count = process_full_pipeline(input_file, output_file)
        print(f"✅ Processamento concluído: {count} entradas processadas")
    except Exception as e:
        print(f"❌ Erro durante o processamento: {e}")
        sys.exit(1)
    
    print()
    
    # Etapa 2: Validação
    print("🔍 ETAPA 2: Validação dos Dados")
    print("-" * 80)
    try:
        stats = validate_dataset(output_file)
        print_validation_report(stats)
        
        if "error" in stats:
            print("❌ Validação falhou!")
            sys.exit(1)
        
        # Verifica se há erros críticos
        if stats.get("entries_with_input", 0) < stats.get("total_entries", 0) * 0.95:
            print("⚠️  Atenção: Menos de 95% das entradas têm campo 'input'")
        
        print("✅ Validação concluída!")
    except Exception as e:
        print(f"❌ Erro durante a validação: {e}")
        sys.exit(1)
    
    print()
    print("=" * 80)
    print("✅ PIPELINE CONCLUÍDO COM SUCESSO!")
    print(f"📄 Dataset pronto em: {output_file}")
    print("=" * 80)


if __name__ == "__main__":
    main()

