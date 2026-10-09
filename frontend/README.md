# Sistema Integrado de Gestão da Qualidade — Frontend

Frontend do SGQ SENAC em HTML, CSS e JavaScript vanilla, servido pelo Vite.

## Como executar

Na pasta frontend, instale as dependências e inicie o servidor:

    npm install
    npm run dev

Acesse o endereço local informado pelo Vite. A autenticação usa Web Crypto SHA-256, disponível em contextos seguros como localhost. Abrir os arquivos diretamente pelo protocolo file:// pode impedir o uso de Web Crypto e não é recomendado.

## Primeiro acesso

Na primeira execução, o sistema cria o administrador padrão:

- E-mail: admin@sgqsenac.com
- Senha: admin123
- Perfil: Admin

Redefina a senha pela gestão de usuários após o primeiro acesso. O aviso de credenciais padrão aparece na tela de login apenas quando a lista de usuários é criada pela primeira vez.

## Perfis e permissões

- **Admin:** acesso total aos módulos, gestão de usuários e configuração das permissões do perfil Usuário.
- **Usuário:** acessa os módulos conforme as permissões de Ver, Editar e Excluir definidas pelo Admin.
- Na gestão de usuários, o Admin pode criar, editar, ativar/desativar, excluir contas e redefinir senhas.
- A aba Permissões permite configurar o perfil Usuário por módulo. As alterações são aplicadas imediatamente.

## Persistência e segurança

Os dados ficam somente no armazenamento local do navegador:

- sgq_senac_usuarios: contas e hashes das senhas.
- sgq_senac_sessao: sessão do navegador atual.
- sgq_senac_permissoes: permissões por módulo e perfil.

As senhas são transformadas com SHA-256 no cliente usando Web Crypto. **Isso NÃO é seguro para produção real**: não há backend, controle de sessão no servidor ou proteção contra adulteração do localStorage. Esta implementação serve para demonstração, protótipo e uso interno controlado.

Para produção real, implemente autenticação e autorização no backend, armazenamento seguro de senhas e banco de dados PostgreSQL. O projeto já declara PostgreSQL no build.gradle.

## Roteiro de teste manual

1. Rode npm run dev e abra a aplicação; sem sessão, deve aparecer a página de login.
2. Entre com admin@sgqsenac.com e admin123.
3. Em Usuários, crie uma conta com nome, e-mail, perfil Usuário e senha inicial.
4. Faça logout, entre com a conta criada e confirme que a gestão de usuários não aparece.
5. Como Admin, abra Usuários > Permissões e desmarque, por exemplo, Editar em Matriz GUT para Usuário.
6. Volte à conta Usuário e confirme que os controles de edição ficam desabilitados. Reative a permissão ao terminar.
7. Faça logout e confirme que a sessão é removida. Recarregar a página com sessão válida mantém a conta conectada.
