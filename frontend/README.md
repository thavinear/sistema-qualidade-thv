# SGQ SENAC — Sistema de Gestão da Qualidade

Frontend web em HTML, CSS e JavaScript, servido pelo Vite. O backend Spring Boot fica em ../backend/sistema-qualidade/.

## Arquitetura

- Frontend: landing page, login e Workspace em HTML/CSS/JavaScript.
- Backend: Java 17 e Spring Boot; autenticação por cookie JWT e API em /api.
- Workspace: dados por usuário persistidos em PostgreSQL como documento JSON em coluna TEXT.
- H2 é usado somente nos testes do backend.

## Requisitos

Node.js 18+, Java 17+ e PostgreSQL para executar o backend.

## Configuração do backend

Defina as variáveis de ambiente antes de iniciar o Spring Boot. Os valores locais estão documentados em ../.env.example (Spring não carrega esse arquivo automaticamente).

- DATABASE_URL: JDBC URL PostgreSQL; padrão jdbc:postgresql://localhost:5432/sgq.
- DB_USERNAME e DB_PASSWORD: credenciais do banco.
- JWT_SECRET: segredo aleatório forte; nunca use um valor de exemplo em produção.
- JWT_EXPIRATION_SECONDS: validade do cookie JWT; padrão 3600.
- AUTH_COOKIE_SECURE: false em HTTP local e true em HTTPS de produção.
- AUTH_COOKIE_SAME_SITE: política SameSite, padrão Lax.
- FRONTEND_ORIGIN: origem CORS, padrão http://localhost:5173.

## Executar em desenvolvimento

Terminal 1 — backend (a partir da raiz do projeto):

    cd backend\sistema-qualidade
    gradlew.bat bootRun

Terminal 2 — frontend (a partir desta pasta):

    npm install
    npm run dev

Abra http://localhost:5173. O proxy Vite encaminha /api para http://localhost:8080. As chamadas incluem cookies e o token CSRF.

O link “Usar sem login” abre o modo demonstrativo local; os dados desse modo ficam no armazenamento do navegador.

## Build

Nesta pasta:

    npm run build

No backend:

    cd ..\backend\sistema-qualidade
    gradlew.bat build
