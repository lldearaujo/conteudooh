# ConteudoOH - Sistema de Mídia Indoor/DOOH

Sistema web desenvolvido em Python (FastAPI) para exibir e gerenciar notícias do site radiocentrocz.com.br em formato de tela cheia, ideal para mídia indoor e DOOH (Digital Out-of-Home).

## Características

- ✅ Framework FastAPI
- ✅ Tela cheia para exibição
- ✅ Painel administrativo completo
- ✅ Banco de dados SQLite
- ✅ Atualização automática de notícias (a cada 30 minutos)
- ✅ Web scraping do site radiocentrocz.com.br

## Instalação

1. Instale as dependências:
```bash
py -m pip install -r requirements.txt
```

ou no Linux/Mac:
```bash
pip install -r requirements.txt
```

## Como Iniciar o Serviço

### Windows (Recomendado)
Duplo clique no arquivo `iniciar.bat` ou execute no terminal:
```bash
iniciar.bat
```

### Linux/Mac
Execute o script:
```bash
chmod +x iniciar.sh
./iniciar.sh
```

### Método Manual

**Windows:**
```bash
py main.py
```

**Linux/Mac:**
```bash
python3 main.py
```

### Usando uvicorn diretamente (com auto-reload):
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Acessar o Sistema

Após iniciar o servidor, acesse:

- **Tela de Exibição (Fullscreen)**: http://localhost:8000/
- **Painel Administrativo**: http://localhost:8000/admin
- **API REST Docs**: http://localhost:8000/docs

### Para acesso remoto (mesma rede):
Substitua `localhost` pelo IP da máquina, exemplo:
- http://192.168.1.100:8000/

## Estrutura do Projeto

```
Conteudooh/
├── main.py              # Aplicação FastAPI principal
├── database.py          # Configuração do banco de dados
├── models.py            # Modelos SQLAlchemy
├── scraper.py           # Web scraping do radiocentrocz.com.br
├── scheduler.py         # Agendamento automático
├── requirements.txt     # Dependências Python
├── templates/           # Templates HTML
│   ├── exibicao.html    # Tela de exibição
│   └── admin.html       # Painel administrativo
└── static/              # Arquivos estáticos
    ├── exibicao.css     # Estilos da tela de exibição
    ├── exibicao.js      # JavaScript da tela de exibição
    ├── admin.css        # Estilos do painel admin
    └── admin.js         # JavaScript do painel admin
```

## Funcionalidades

### Tela de Exibição (`/`)
- Exibição em tela cheia
- Layout responsivo e moderno
- Relógio e data em tempo real
- Auto-scroll das notícias
- Auto-refresh a cada 5 minutos

### Painel Administrativo (`/admin`)
- Visualização de todas as notícias
- Estatísticas (total, ativas, inativas)
- Ativar/desativar notícias
- Deletar notícias
- Atualização manual das notícias

### API REST
- `GET /api/noticias` - Lista todas as notícias
- `GET /api/noticias/{id}` - Obtém uma notícia específica
- `POST /api/noticias/atualizar` - Força atualização das notícias
- `PUT /api/noticias/{id}` - Atualiza uma notícia
- `DELETE /api/noticias/{id}` - Deleta uma notícia
- `PATCH /api/noticias/{id}/toggle` - Ativa/desativa uma notícia

## Configuração

O sistema atualiza automaticamente as notícias a cada 30 minutos. Para alterar este intervalo, edite o arquivo `scheduler.py`:

```python
scheduler.add_job(
    atualizar_noticias_automaticamente,
    trigger=IntervalTrigger(minutes=30),  # Altere aqui
    ...
)
```

## Notas

- O web scraping pode precisar de ajustes dependendo da estrutura do site radiocentrocz.com.br
- O banco de dados SQLite será criado automaticamente na primeira execução
- A primeira atualização de notícias ocorre imediatamente ao iniciar o servidor

