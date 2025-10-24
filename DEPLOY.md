# 🚀 Deploy na Vercel - Sistema de Gerenciamento de Projetos

## Passo a Passo para Deploy

### 1. Acessar a Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub
3. Clique em **"Add New Project"**

### 2. Importar o Repositório
1. Selecione o repositório: `gestao-projetos-nosso-atacarejo`
2. Clique em **"Import"**

### 3. Configurar o Projeto
Na tela de configuração:

**Framework Preset:** Vite
**Root Directory:** `./` (deixe em branco)
**Build Command:** `pnpm build`
**Output Directory:** `client/dist`
**Install Command:** `pnpm install`

### 4. Configurar Banco de Dados
1. Na página do projeto na Vercel, vá em **"Storage"**
2. Clique em **"Create Database"**
3. Selecione **"Postgres"**
4. Clique em **"Continue"**
5. Aceite os termos e clique em **"Create"**
6. A Vercel criará automaticamente a variável `DATABASE_URL`

### 5. Adicionar Variáveis de Ambiente
Na aba **"Settings" → "Environment Variables"**, adicione:

```
JWT_SECRET=sua-chave-secreta-aqui-minimo-32-caracteres
VITE_APP_TITLE=Sistema de Gerenciamento de Projetos
VITE_APP_ID=gestao-projetos
```

**Importante:** Gere uma chave JWT segura. Você pode usar:
```bash
openssl rand -base64 32
```

### 6. Deploy
1. Clique em **"Deploy"**
2. Aguarde o build finalizar (2-3 minutos)
3. Seu site estará disponível em: `https://seu-projeto.vercel.app`

### 7. Configurar Domínio Personalizado (Opcional)
1. Vá em **"Settings" → "Domains"**
2. Adicione seu domínio personalizado
3. Configure os DNS conforme instruções da Vercel

## ⚠️ Importante

### Migração do Banco de Dados
Após o primeiro deploy, você precisa rodar as migrações:

1. Na Vercel, vá em **"Settings" → "Functions"**
2. Ou acesse o terminal do projeto e rode:
```bash
pnpm db:push
```

### Dados de Exemplo
Os dados de exemplo (10 projetos e 30 atividades) não serão migrados automaticamente. Você precisará:
1. Cadastrar as pessoas manualmente
2. Cadastrar os projetos
3. Cadastrar as atividades

Ou você pode exportar os dados do banco atual e importar no novo banco PostgreSQL da Vercel.

## 📞 Suporte
Se tiver problemas, consulte a documentação da Vercel: https://vercel.com/docs

