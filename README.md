# 🟦 SGQ SENAC — Sistema de Gestão da Qualidade

Aplicação web desenvolvida para apoiar o gerenciamento da qualidade por meio do ciclo PDCA e de ferramentas como Matriz GUT, Pareto, Ishikawa, 5 Porquês, 5W2H, Fluxograma/POP e Checklist.

---

## 🟪 Arquitetura

- **Frontend:** HTML, CSS e JavaScript, utilizando Vite.
- **Backend:** Java 17 e Spring Boot.
- **API:** autenticação por cookie JWT e gerenciamento de Workspace por usuário.
- **Banco de dados:** PostgreSQL para ambientes configurados por variáveis de ambiente. Para execução local, o sistema utiliza H2 em memória por padrão.

## 🟦 Estrutura do projeto

```plaintext
sistema-qualidade-thv/
├── apresentacao/
├── backend/
│   └── sistema-qualidade/
├── frontend/
├── mobile/
├── .env.example
├── .gitignore
└── README.md
```

---

## 🟩 Requisitos

Antes de executar o projeto, instale:

- **Git:** para clonar o repositório.
- **Java JDK 17 ou superior:** necessário para executar o backend.
- **Node.js 18 ou superior:** inclui o npm, utilizado pelo frontend.

Para conferir se as ferramentas estão instaladas, execute:

```bash
git --version
java -version
node -v
npm -v
```

> 🟡 O Java deve ser o JDK, não apenas o JRE.

---

## 🟦 Como baixar o projeto

Clone o repositório:

```bash
git clone https://github.com/thavinear/sistema-qualidade-thv.git
```

Entre na pasta do projeto:

```bash
cd sistema-qualidade-thv
```

---

## 🟪 Executar o projeto localmente

O frontend e o backend devem ser executados em dois terminais separados.

### 🟩 1. Backend

Abra um terminal e entre na pasta:

```bash
cd backend/sistema-qualidade
```

**Windows (PowerShell ou Prompt de Comando):**

```powershell
.\gradlew.bat bootRun
```

**Linux ou macOS:**

```bash
chmod +x gradlew
./gradlew bootRun
```

O backend será iniciado em:

```text
http://localhost:8081
```

Na configuração local padrão, o sistema utiliza o banco H2 em memória. Não é necessário instalar ou iniciar o PostgreSQL para essa execução.

### 🟦 2. Frontend

Abra um segundo terminal, na pasta principal do projeto, e entre na pasta do frontend:

```bash
cd frontend
```

Instale as dependências:

**Windows (PowerShell):**

```powershell
npm.cmd install
```

**Linux, macOS ou terminais que aceitam npm normalmente:**

```bash
npm install
```

Depois, inicie o servidor:

**Windows (PowerShell):**

```powershell
npm.cmd run dev
```

**Linux, macOS ou terminais que aceitam npm normalmente:**

```bash
npm run dev
```

Acesse o frontend pelo endereço:

```text
http://localhost:5173
```

O Vite está configurado para encaminhar as requisições iniciadas por `/api` para o backend em [http://localhost:8081](http://localhost:8081 "http://localhost:8081/").

> 🟡 **Observação para Windows:** se o PowerShell bloquear a execução de `npm.ps1`, utilize `npm.cmd` nos comandos do npm.

---

## 🟧 Configurações do ambiente

As principais configurações do backend ficam em:

```text
backend/sistema-qualidade/src/main/resources/application.properties
```

O projeto utiliza as seguintes variáveis de ambiente:

| Variável | Finalidade |
|:---|:---|
| `DATABASE_URL` | Endereço de conexão com o banco de dados |
| `DB_USERNAME` | Usuário do banco de dados |
| `DB_PASSWORD` | Senha do banco de dados |
| `JWT_SECRET` | Chave utilizada para autenticação JWT |
| `COOKIE_SECURE` | Configuração de segurança do cookie |
| `COOKIE_SAME_SITE` | Política SameSite do cookie |
| `FRONTEND_ORIGIN` | Origem permitida para o frontend |
| `PORT` | Porta utilizada pelo backend |

Quando essas variáveis não são definidas, o projeto utiliza os valores padrão configurados no `application.properties`, incluindo o H2 em memória para execução local.

> 🔴 **Importante:** para ambientes de produção, configure as variáveis de ambiente com valores próprios e seguros. Não publique senhas, chaves JWT ou credenciais no repositório.

---

## 🟩 Compilar o projeto

### Frontend

Entre na pasta `frontend`:

```bash
npm run build
```

No PowerShell do Windows, se necessário:

```powershell
npm.cmd run build
```

Os arquivos compilados serão gerados na pasta `frontend/dist`.

### Backend

Entre na pasta `backend/sistema-qualidade`:

**Windows:**

```powershell
.\gradlew.bat build
```

**Linux ou macOS:**

```bash
./gradlew build
```

---

## 🟦 Solução de problemas

- **Java não encontrado:** verifique se o JDK 17 ou superior está instalado e configurado no `PATH`.
- **Versão incorreta do Java:** confira a saída de `java -version`.
- **Erro ao executar o Gradle:** verifique se o terminal está na pasta `backend/sistema-qualidade`.
- **Erro de execução do npm no PowerShell:** utilize `npm.cmd` no lugar de `npm`.
- **Frontend não consegue acessar a API:** confirme se o backend está em execução na porta `8081`.
- **Porta ocupada:** verifique se outro processo está utilizando a porta necessária.
- **Dados locais não permanecem após reiniciar:** a configuração padrão utiliza H2 em memória, portanto os dados são temporários.

---

## 🟪 Equipe

Projeto desenvolvido como atividade acadêmica do SENAC-DF.
