# Plano de Testes - LabReserva v1.4

> Observação: o arquivo REQUISITOS.md não está disponível no workspace acessado neste momento. O plano abaixo foi estruturado com base no enunciado da avaliação, no cenário informado do sistema LabReserva v1.4 e nos defeitos já observados em RNF01 a RNF03.

## 1. Análise dos requisitos

### 1.1 Regras de negócio (RN01 a RN05)

- RN01 — Autenticação
  - Usuário deve realizar login com e-mail e senha válidos.
  - Usuário sem autenticação não pode acessar operações de reserva.
  - Usuário padrão do sistema: instrutor1@senac.br / 123456.

- RN02 — Cadastro de reserva
  - A reserva deve informar laboratório, data, horário e quantidade de alunos.
  - A data deve ser futura e válida.
  - O sistema deve rejeitar data passada ou inválida.

- RN03 — Limite de alunos
  - A quantidade de alunos deve estar entre 1 e 20.
  - Valores fora do intervalo devem ser bloqueados.

- RN04 — Conflito de horários
  - O mesmo laboratório não pode ter duas reservas sobrepostas na mesma data/horário.
  - Deve ser identificado conflito de agenda.

- RN05 — Cancelamento de reserva
  - Somente o usuário responsável ou um administrador/instrutor autorizado pode cancelar uma reserva.
  - Caso a reserva não exista, o sistema deve informar o erro adequado.

### 1.2 Regras de API (RF07)

- RF07 — API de reservas e autenticação
  - 400 Bad Request: dados inválidos, campos obrigatórios ausentes ou valores fora do domínio.
  - 401 Unauthorized: token ausente ou inválido.
  - 403 Forbidden: usuário autenticado, mas sem permissão para a operação.
  - 404 Not Found: reserva ou laboratório não encontrado.
  - 409 Conflict: conflito de agenda ou duplicidade de reserva.
  - 500 Internal Server Error: falha inesperada do backend.

### 1.3 Regras de fluxo (RF01 a RF06)

- RF01 — Login
  - Usuário informa e-mail e senha.
  - Sistema valida e retorna erro para credenciais inválidas.

- RF02 — Nova reserva
  - Usuário autenticado inicia nova reserva.
  - Sistema valida laboratório, data, período e número de alunos.

- RF03 — Validação de conflito
  - Sistema compara a nova reserva com reservas existentes do mesmo laboratório.
  - Se houver sobreposição, registra conflito.

- RF04 — Cancelar reserva
  - Usuário acessa a reserva existente e executa cancelamento.
  - Quando permitido, a operação é concluída.

- RF05 — Listagem de reservas
  - Sistema retorna reservas disponíveis e/ou do usuário autenticado.
  - Deve respeitar o filtro correto.

- RF06 — Tratamento de erros
  - Operações inválidas devem devolver mensagem clara e código HTTP correto.

## 2. Tabela de Casos de Teste (CT01 a CT15)

| ID | Requisito | Técnica | Caso e dados de entrada | Resultado Esperado |
| --- | --- | --- | --- | --- |
| CT01 | RF01 / RN01 | Partição de Equivalência | Login com usuário válido: instrutor1@senac.br / 123456 | Login concluído com sucesso e token gerado |
| CT02 | RF01 / RN01 | Partição de Equivalência | Login com senha incorreta | Retorna erro de autenticação e não cria sessão |
| CT03 | RF01 / RN01 | Partição de Equivalência | Login sem token em rota protegida | API responde 401 Unauthorized |
| CT04 | RF02 / RN02 | Valor-Limite | Nova reserva com data passada: labId=1, data=2024-01-10, horario=08:00, alunos=8 | Bloqueado com erro de data inválida |
| CT05 | RF02 / RN02 | Partição de Equivalência | Nova reserva com data atual/futura válida | Aceita quando respeitar todas outras regras |
| CT06 | RF02 / RN03 | Valor-Limite | Reserva com alunos=0 | Rejeita com erro de quantidade de alunos fora do limite |
| CT07 | RF02 / RN03 | Valor-Limite | Reserva com alunos=1 | Aceita e gera reserva válida |
| CT08 | RF02 / RN03 | Valor-Limite | Reserva com alunos=20 | Aceita e gera reserva válida |
| CT09 | RF02 / RN03 | Valor-Limite | Reserva com alunos=21 | Rejeita por exceder o limite máximo |
| CT10 | RF03 / RN04 | Teste de Conflito | Reserva em Lab 1 na data X, turno 08:00, sobreposta com outra já existente | Retorna 409 Conflict |
| CT11 | RF03 / RN04 | Teste de Conflito | Reserva em mesmo lab e mesmo dia, mas em horário diferente | Aceita, sem conflito |
| CT12 | RF04 / RN05 | Fluxo | Cancelar uma reserva própria existente | Cancelamento concluído com sucesso |
| CT13 | RF04 / RN05 | Permissão | Cancelar reserva de outro usuário sem autorização | Retorna 403 Forbidden |
| CT14 | RF05 / RF07 | API / Partição | Consultar reservas sem filtro com usuário autenticado | Lista reservas válidas e código de sucesso |
| CT15 | RF06 / RF07 | API / Exceção | Solicitar laboratório ou reserva inexistente | Retorna 404 Not Found |

## 3. Tabela de Execução

| ID | Resultado Obtido | Situação (Passou/Falhou/Bloqueado) | Evidência | Executado por |
| --- | --- | --- | --- | --- |
| CT01 |  |  |  |  |
| CT02 |  |  |  |  |
| CT03 |  |  |  |  |
| CT04 |  |  |  |  |
| CT05 |  |  |  |  |
| CT06 |  |  |  |  |
| CT07 |  |  |  |  |
| CT08 |  |  |  |  |
| CT09 |  |  |  |  |
| CT10 |  |  |  |  |
| CT11 |  |  |  |  |
| CT12 |  |  |  |  |
| CT13 |  |  |  |  |
| CT14 |  |  |  |  |
| CT15 |  |  |  |  |

## 4. Registro de defeitos adicionais

### Defeitos já conhecidos da avaliação

| Caso | Título do defeito | Requisito | Esperado | Obtido | Severidade | Evidência |
| --- | --- | --- | --- | --- | --- | --- |
| CT16 | Mensagem de erro genérica para alunos inválidos | RN03 | Sistema deve informar que o limite permitido é de 1 a 20 alunos | Mensagem genérica não informa o limite exato | Média | Evidência de teste de acessibilidade/uso e relatório de RNF01 |
| CT17 | Lighthouse aponta falta de main landmark | RNF02 | Página principal deve possuir landmark main | Landmark principal ausente | Baixa | Relatório Lighthouse |
| CT19 | Tela não se adapta em 360px | RNF03 | Layout deve funcionar em 360px sem quebra | Layout quebra em largura pequena | Média | Evidência de inspeção visual em mobile |

### Defeitos adicionais simulados com base nos requisitos

| Caso | Título do defeito | Requisito | Esperado | Obtido | Severidade | Evidência |
| --- | --- | --- | --- | --- | --- | --- |
| CT-A01 | Reserva de data passada aceita | RN02 | Sistema deve bloquear reserva com data passada | Reserva é criada em data anterior | Crítica | Requisição POST com data anterior |
| CT-A02 | Reserva sem token permite acesso | RF07 / RN01 | API exige autenticação e responde 401 | Operação continua sem token | Crítica | Chamada HTTP sem Authorization |
| CT-A03 | Dois usuários reservam o mesmo horário no mesmo laboratório | RN04 | Deve bloquear conflito de agenda com 409 | Sistema aceita sobreposição | Crítica | Requisições simultâneas em mesmo lab e horário |
| CT-A04 | Usuário sem permissão cancela reserva de outro usuário | RN05 / RF07 | Retorna 403 Forbidden | Permite cancelamento de terceiros | Alta | Requisição DELETE em reserva não pertencente |
| CT-A05 | Limite de alunos não é validado no backend | RN03 | Bloquear reservas com 0 ou 21 alunos | Backend aceita valores fora do intervalo | Alta | Registro com alunos=0 ou 21 |
| CT-A06 | Laboratório inexistente retorna 200 em vez de 404 | RF07 | Sistema deve informar 404 Not Found | API responde sucesso inconsistente | Média | Requisição de labId inexistente |
| CT-A07 | Mensagem de erro para conflito não é clara | RN04 / RF07 | Resposta deve indicar conflito de horário | Mensagem genérica ou ambígua | Média | Requisição que gera sobreposição |
| CT-A08 | Falha de servidor não tratada corretamente | RF07 | Erros inesperados devem responder 500 | Sistema retorna resposta inconsistente | Média | Simulação de erro interno |

## 5. Observações finais

- O foco principal da automação deve estar em:
  - Login válido e inválido.
  - Reserva em data futura e passada.
  - Limite de alunos de 1 a 20.
  - Conflito de sobreposição.
  - Cancelamento autorizado e não autorizado.
- O backend deve ser validado com Postman para códigos HTTP esperados.
- O frontend deve ser validado para mensagens de erro e bloqueios de interação.
- A evidência de falha deve sempre incluir dados da requisição, resposta HTTP e contexto do caso de teste.
