# 🦙 Guia: Rodando o Biobyia no Ollama (Via Python Venv)
Como você não vai usar Docker, usaremos um **Ambiente Virtual Python (venv)**. Isso mantém seu computador limpo e instala as ferramentas apenas para este projeto.
## 🛠️ Passo 1: Criar o Ambiente Virtual (.venv)
No terminal, dentro da pasta do projeto, execute:
1.  **Crie o ambiente:**
    ```bash
    python3 -m venv .venv
    ```
2.  **Ative o ambiente:**
    ```bash
    source .venv/bin/activate
    ```
    *(Você verá um `(.venv)` no início da linha do seu terminal)*
3.  **Instale as ferramentas de conversão:**
    ```bash
    pip install llama-cpp-python
    # Ou se precisar dos scripts oficiais:
    pip install hf_transfer huggingface_hub
    ```
---
## 🏗️ Passo 2: Converter e Quantizar
Para transformar o modelo em GGUF (formato do Ollama), siga estes subpassos:
1.  **Instale o `llama.cpp` localmente** (apenas os scripts):
    ```bash
    git clone https://github.com/ggerganov/llama.cpp
    cd llama.cpp
    pip install -r requirements.txt
    ```
2.  **Execute a Conversão** (de Safetensors para GGUF):
    ```bash
    python3 convert_hf_to_gguf.py ../ --outtype f16 --outfile ../model.f16.gguf
    ```
3.  **Compile e Execute a Quantização** (via CMake):
    ```bash
    # Primeiro, prepare e compile o projeto
    cmake -B build
    cmake --build build --config Release -j 8
    
    # Verifique se o arquivo da conversão realmente existe (Deve aparecer model.f16.gguf)
    ls -lh ../model.f16.gguf
    # Agora execute a quantização usando o caminho completo para evitar erros:
    ./build/bin/llama-quantize "$(pwd)/../model.f16.gguf" "$(pwd)/../biomedbyia-q4.gguf" Q4_K_M
    ```
---
## 🚀 Passo 3: Configurar o Ollama
Agora volte para a pasta raiz do projeto:
```bash
cd ..
```
1.  **Crie o modelo no Ollama**:
    ```bash
    ollama create biomedbyia -f Modelfile
    ```
2.  **Rode o modelo**:
    ```bash
    ollama run biomedbyia
    ```
---
## 🧪 Como Testar o Fine-Tuning
Para verificar se o seu ajuste fino (fine-tuning) médico está funcionando, você deve testar perguntas técnicas que um modelo comum (como o Llama 3 puro) poderia responder de forma genérica, enquanto o seu deve ser mais preciso.
### Teste Rápido via Terminal:
```bash
ollama run biomedbyia "Qual o protocolo de tratamento para uma crise hipertensiva em ambiente hospitalar?"
```
---
## 🔌 Exemplo de Integração (Python)
A forma mais simples de integrar este modelo na sua aplicação é usando a biblioteca oficial do Ollama.
1.  **Instale os requisitos:**
    ```bash
    pip install ollama
    ```
2.  **Use este código de exemplo:**
    ```python
    import ollama
    response = ollama.chat(model='biomedbyia', messages=[
        {
            'role': 'user',
            'content': 'Quais são os sinais de alerta para sepse em pediatria?',
        },
    ])
    print(response['message']['content'])
    ```
---