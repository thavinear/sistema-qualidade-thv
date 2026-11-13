# SGQ SENAC — Sistema de Gestão da Qualidade

Aplicação web para apoiar o ciclo PDCA e as ferramentas de gestão da qualidade: Matriz GUT, Pareto, Ishikawa, 5 Porquês, 5W2H, Fluxograma/POP e Checklist.

## Arquitetura

- **Frontend:** HTML, CSS e JavaScript, servido e empacotado pelo Vite em frontend/.
- **Backend:** Java 17 e Spring Boot em backend/sistema-qualidade/.
- **API:** autenticação por cookie JWT em /api/auth e persistência de Workspace por usuário em /api/workspace.
- **Banco:** PostgreSQL configurado por variáveis de ambiente. H2 é usado somente nos testes do backend.
- A landing page e as telas autenticadas ficam em frontend/index.html, frontend/login.html e frontend/app.html.

## Requisitos

- Node.js 18 ou superior
- Java 17 ou superior
- PostgreSQL acessível para executar a aplicação

## Configuração

Configure as variáveis abaixo no ambiente do backend:

| Variável | Uso |
| --- | --- |
| DATABASE_URL | JDBC URL do PostgreSQL (padrão: jdbc:postgresql://localhost:5432/sgq) |
| DB_USERNAME / DB_PASSWORD | Credenciais do banco |
| JWT_SECRET | Segredo forte para assinatura dos cookies JWT |
| JWT_EXPIRATION_SECONDS | Validade do token (padrão: 3600) |
| AUTH_COOKIE_SECURE | Use false em desenvolvimento HTTP local; true em produção HTTPS |
| AUTH_COOKIE_SAME_SITE | Política SameSite do cookie (padrão: Lax) |
| FRONTEND_ORIGIN | Origem permitida pelo CORS (padrão: http://localhost:5173) |

Não use o segredo JWT padrão em produção. O acesso sem login (?mode=simple) é um modo demonstrativo que mantém os dados localmente no navegador.

## Executar localmente

Terminal 1 — backend:

```powershell
cd backend\sistema-qualidade
./gradlew bootRun
```

O serviço escuta em http://localhost:8080. No Windows, use gradlew.bat bootRun.

Terminal 2 — frontend:

```powershell
cd frontend
npm install
npm run dev
```

Abra http://localhost:5173. O Vite encaminha /api ao backend em localhost:8080; cookies e proteção CSRF são enviados pelo cliente.

## Build

```powershell
cd frontend
npm run build
cd ..\backend\sistema-qualidade
./gradlew build
```

No Windows, execute gradlew.bat build.
