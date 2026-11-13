# SGQ SENAC — Sistema de Gestão da Qualidade

Aplicação web para apoiar o ciclo PDCA e as ferramentas de gestão da qualidade: Matriz GUT, Pareto, Ishikawa, 5 Porquês, 5W2H, Fluxograma/POP e Checklist.

## Arquitetura

- **Frontend:** HTML, CSS e JavaScript, servido e empacotado pelo Vite em `frontend/`.
- **Backend:** Java 17 e Spring Boot em `backend/sistema-qualidade/`.
- **API:** autenticação por cookie JWT em `/api/auth` e persistência de Workspace por usuário em `/api/workspace`.
- **Banco:** PostgreSQL configurado por variáveis de ambiente. Para facilitar os testes locais (sem Docker), o projeto está configurado para usar **H2 em memória** por padrão no `application.properties`.
- A landing page e as telas autenticadas ficam em `frontend/index.html`, `frontend/login.html` e `frontend/app.html`.

## Requisitos

- Node.js 18 ou superior
- Java 17 ou superior

## Executar localmente

**Terminal 1 — Backend (Java/Spring Boot):**
Abra o terminal e entre na pasta do backend:
```bash
cd "C:\Users\thavine58152566\Downloads\sistema-qualidade-thv-main (5)\sistema-qualidade-thv-main (4)\sistema-qualidade-thv-main\backend\sistema-qualidade"
Rode o backend:

bash
.\gradlew.bat bootRun
O serviço vai escutar em http://localhost:8081 (ou na porta configurada no application.properties).

Terminal 2 — Frontend (Vite):
Abra um novo terminal e entre na pasta do frontend:

bash
cd "C:\Users\thavine58152566\Downloads\sistema-qualidade-thv-main (5)\sistema-qualidade-thv-main (4)\sistema-qualidade-thv-main\frontend"
Instale as dependências (se for a primeira vez) e rode:

bash
npm install
npm run dev
Abra http://localhost:5173. O Vite encaminha as chamadas /api para o backend.

Build
Frontend:

bash
cd "C:\Users\thavine58152566\Downloads\sistema-qualidade-thv-main (5)\sistema-qualidade-thv-main (4)\sistema-qualidade-thv-main\frontend"
npm run build
Backend:

bash
cd "C:\Users\thavine58152566\Downloads\sistema-qualidade-thv-main (5)\sistema-qualidade-thv-main (4)\sistema-qualidade-thv-main\backend\sistema-qualidade"
.\gradlew.bat build