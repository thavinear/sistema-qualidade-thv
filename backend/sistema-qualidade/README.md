# Backend SGQ SENAC

API Java 17 / Spring Boot 4, Spring Security, Spring Data JPA e PostgreSQL. O login emite um JWT assinado em cookie `HttpOnly`; não retorna token ao JavaScript. Alterações autenticadas usam proteção CSRF por cookie duplo (`SGQ_CSRF` + cabeçalho `X-CSRF-TOKEN`). Senhas são armazenadas somente como hash BCrypt.

## Configuração local (PowerShell)

Crie um banco PostgreSQL `sgq` e configure as variáveis no terminal antes de iniciar:

```powershell
$env:DATABASE_URL = 'jdbc:postgresql://localhost:5432/sgq'
$env:DB_USERNAME = '<usuario do PostgreSQL>'
$env:DB_PASSWORD = '<senha do PostgreSQL>'
$env:JWT_SECRET = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
$env:SGQ_ADMIN_EMAIL = '<email do administrador inicial>'
$env:SGQ_ADMIN_PASSWORD = '<senha inicial com pelo menos 10 caracteres>'
$env:FRONTEND_ORIGIN = 'http://localhost:5173'
$env:AUTH_COOKIE_SECURE = 'false'
./gradlew.bat bootRun
```

O bootstrap cria um administrador somente se as duas variáveis `SGQ_ADMIN_*` estiverem definidas e o e-mail ainda não existir. Não há conta ou senha padrão no código. Usuários também podem se cadastrar pela tela de login; cadastro público sempre cria perfil `USER`. O banco normal usa PostgreSQL e `ddl-auto=update`; testes usam H2.

Para produção, use HTTPS, `AUTH_COOKIE_SECURE=true`, segredos exclusivos do ambiente e um proxy que publique frontend e API sob a mesma origem. Se hospedá-los em origens diferentes, defina `AUTH_COOKIE_SAME_SITE=None`, mantenha `AUTH_COOKIE_SECURE=true`, `FRONTEND_ORIGIN` com a origem exata e `window.SGQ_API_BASE` com a URL pública da API antes de carregar `src/auth.js`.

## Endpoints

| Método | Rota | Acesso | Função |
|---|---|---|---|
| POST | `/api/auth/register` | Público | Cadastro USER e início da sessão |
| POST | `/api/auth/login` | Público | Login e emissão do cookie JWT |
| GET | `/api/auth/me` | Autenticado | Usuário e permissões da sessão |
| POST | `/api/auth/logout` | Autenticado + CSRF | Encerra a sessão no navegador |
| GET | `/api/admin/users` | ADMIN | Lista usuários |
| POST | `/api/admin/users` | ADMIN + CSRF | Cria usuário, perfil e permissões |
| PUT | `/api/admin/users/{id}` | ADMIN + CSRF | Edita usuário, perfil, status, permissões e senha opcional |
| DELETE | `/api/admin/users/{id}` | ADMIN + CSRF | Exclui usuário |
| GET | `/api/workspace` | Autenticado | Carrega apenas os módulos permitidos do próprio usuário |
| PUT | `/api/workspace` | Autenticado + permissões + CSRF | Salva os módulos autorizados do próprio usuário |
| GET | `/api/teste` | Público | Verificação simples do backend |

Permissões seguem `modulo:acao`, com ações `view`, `edit` e `delete`. O administrador tem acesso total. Alterações de dados são isoladas por usuário; o servidor preserva módulos sem permissão e bloqueia operações não autorizadas.

## Verificação

```powershell
./gradlew.bat test
./gradlew.bat build
```
