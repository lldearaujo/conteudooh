#!/bin/bash

echo "========================================"
echo "  Deploy Automatizado - ConteudoOH"
echo "========================================"
echo ""

# Verificar se Git está instalado
if ! command -v git &> /dev/null; then
    echo "❌ Git não está instalado!"
    echo ""
    echo "📥 Instale o Git: https://git-scm.com/downloads"
    exit 1
fi

echo "✅ Git encontrado!"
echo ""

# Verificar se estamos em um repositório Git
if [ ! -d .git ]; then
    echo "📦 Inicializando repositório Git..."
    git init
    git branch -M main
    echo "✅ Repositório inicializado!"
    echo ""
fi

# Verificar se há remote configurado
if ! git remote get-url origin &> /dev/null; then
    echo "⚠️  Repositório GitHub não configurado!"
    echo ""
    echo "📋 PRÓXIMOS PASSOS:"
    echo ""
    echo "1. Crie um repositório no GitHub:"
    echo "   https://github.com/new"
    echo ""
    echo "2. Depois execute:"
    echo "   git remote add origin https://github.com/SEU_USUARIO/conteudooh.git"
    echo "   git push -u origin main"
    echo ""
    exit 1
fi

echo "✅ Repositório GitHub configurado!"
echo ""

# Mostrar status
echo "📊 Status do repositório:"
git status --short
echo ""

# Perguntar se deseja fazer commit e push
read -p "Deseja fazer commit e push para GitHub? (S/N): " fazer_deploy

if [[ ! "$fazer_deploy" =~ ^[Ss]$ ]]; then
    echo ""
    echo "⏭️  Pulando commit/push."
else
    echo ""
    echo "📝 Fazendo commit..."
    git add .
    git commit -m "Deploy: Atualização do sistema ConteudoOH - $(date)"
    
    echo ""
    echo "🚀 Fazendo push para GitHub..."
    git push origin main
    
    if [ $? -ne 0 ]; then
        echo ""
        echo "⚠️  Erro ao fazer push. Verifique:"
        echo "   - Se você está autenticado no GitHub"
        echo "   - Se o repositório existe"
        echo "   - Se você tem permissões"
        exit 1
    fi
    
    echo ""
    echo "✅ Código enviado para GitHub com sucesso!"
    echo ""
fi

echo "========================================"
echo "  Próximo Passo: EasyPanel"
echo "========================================"
echo ""
echo "🌐 Agora acesse o EasyPanel:"
echo "   https://easypanel.io"
echo ""
echo "📋 INSTRUÇÕES:"
echo ""
echo "1. Faça login no EasyPanel"
echo "2. Clique em 'New Project' ou '+'"
echo "3. Escolha 'App' ou 'Web Service'"
echo "4. Conecte seu repositório GitHub"
echo "5. Selecione o repositório: conteudooh"
echo "6. EasyPanel detectará o Dockerfile automaticamente"
echo "7. Configure porta: 8080"
echo "8. Clique em 'Deploy'"
echo ""
echo "✅ O Dockerfile já está configurado!"
echo ""
echo "📖 Veja DEPLOY_EASYPANEL.md para mais detalhes"
echo ""

