#!/usr/bin/env python3
"""
Script principal para executar o pipeline completo de preparação de dados e fine-tuning
"""

import sys
import argparse
from pathlib import Path

# Adiciona diretório atual ao path para imports
sys.path.append(str(Path(__file__).parent))

from preprocessing.data_processor import process_full_pipeline
from preprocessing.validate_data import validate_dataset, print_validation_report
from preprocessing.format_to_chatml import format_medical_to_chatml


def run_preprocessing():
    """Executa pipeline de pré-processamento: processamento + validação"""
    print("=" * 80)
    print("PIPELINE DE PREPARAÇÃO DE DADOS MÉDICOS")
    print("=" * 80)
    print()
    
    BASE_DIR = Path(__file__).parent
    input_file = BASE_DIR.parent / 'context' / 'pubmedqa-master' / 'data' / 'ori_pqal.json'
    output_file = BASE_DIR / 'medical_tuning_data.json'
    
    # Verifica arquivo de entrada
    if not input_file.exists():
        print(f"[ERRO] Arquivo não encontrado: {input_file}")
        print("Por favor, verifique o caminho do arquivo.")
        sys.exit(1)
    
    # Etapa 1: Processamento
    print("ETAPA 1: Processamento de Dados")
    print("-" * 80)
    try:
        count = process_full_pipeline(str(input_file), str(output_file))
        print(f"[OK] Processamento concluído: {count} entradas processadas")
    except Exception as e:
        print(f"[ERRO] Durante o processamento: {e}")
        sys.exit(1)
    
    print()
    
    # Etapa 2: Validação
    print("ETAPA 2: Validação dos Dados")
    print("-" * 80)
    try:
        stats = validate_dataset(str(output_file))
        print_validation_report(stats)
        
        if "error" in stats:
            print("[ERRO] Validação falhou!")
            sys.exit(1)
        
        # Verifica se há erros críticos
        if stats.get("entries_with_input", 0) < stats.get("total_entries", 0) * 0.95:
            print("[AVISO] Menos de 95% das entradas têm campo 'input'")
        
        print("[OK] Validação concluída!")
    except Exception as e:
        print(f"[ERRO] Durante a validação: {e}")
        sys.exit(1)
    
    print()
    print("=" * 80)
    print("PRÉ-PROCESSAMENTO CONCLUÍDO COM SUCESSO!")
    print(f"Dataset pronto em: {output_file}")
    print("=" * 80)
    
    return output_file


def run_formatting():
    """Formata dataset para formato ChatML"""
    print("=" * 80)
    print("FORMATAÇÃO PARA FORMATO CHATML")
    print("=" * 80)
    print()
    
    BASE_DIR = Path(__file__).parent
    input_file = BASE_DIR / 'medical_tuning_data.json'
    output_file = BASE_DIR / 'formatted_medical_dataset.jsonl'
    
    if not input_file.exists():
        print(f"[ERRO] Dataset não encontrado: {input_file}")
        print("Execute primeiro: python run_pipeline.py --preprocess")
        sys.exit(1)
    
    try:
        stats = format_medical_to_chatml(str(input_file), str(output_file))
        print()
        print("=" * 80)
        print("FORMATAÇÃO CONCLUÍDA COM SUCESSO!")
        print(f"Dataset formatado em: {output_file}")
        print("=" * 80)
        return output_file
    except Exception as e:
        print(f"[ERRO] Durante formatação: {e}")
        sys.exit(1)


def main():
    """Função principal com argumentos de linha de comando"""
    parser = argparse.ArgumentParser(
        description="Pipeline completo de preparação e fine-tuning de dados médicos"
    )
    parser.add_argument(
        "--preprocess",
        action="store_true",
        help="Executa pré-processamento (processamento + validação)"
    )
    parser.add_argument(
        "--format",
        action="store_true",
        help="Formata dataset para formato ChatML (JSONL)"
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Executa todo o pipeline: pré-processamento + formatação"
    )
    
    args = parser.parse_args()
    
    # Se nenhum argumento, executa tudo
    if not any([args.preprocess, args.format, args.all]):
        args.all = True
    
    if args.all or args.preprocess:
        run_preprocessing()
        print()
    
    if args.all or args.format:
        run_formatting()
    
    if args.all:
        print("\n" + "=" * 80)
        print("PIPELINE COMPLETO FINALIZADO!")
        print("=" * 80)
        print("\nPróximos passos:")
        print("  1. Revise o dataset formatado: formatted_medical_dataset.jsonl")
        print("  2. Execute o fine-tuning:")
        print("     - Notebook: jupyter notebook training/finetuning_medical.ipynb")
        print("     - Script: python training/finetuning_medical.py")
        print("=" * 80)


if __name__ == "__main__":
    main()

