# SGQ Senac — Mockups visuais

Este diretório contém mockups estáticos em HTML + CSS puro para representar o sistema de gestão da qualidade SGQ Senac em múltiplos tamanhos de tela.

## Estrutura

- `mockups/design-system.html` — paleta de cores, tipografia e componentes
- `mockups/dashboard.html` — dashboard PDCA em 3 frames
- `mockups/gut.html` — matriz GUT em 3 frames
- `mockups/pareto.html` — Pareto em 3 frames
- `mockups/ishikawa.html` — diagrama Ishikawa em 3 frames
- `mockups/porques.html` — cadeia de 5 porquês em 3 frames
- `mockups/5w2h.html` — tabela 5W2H em 3 frames
- `mockups/fluxograma.html` — fluxograma + POP em 3 frames
- `mockups/relatorio.html` — formulário + preview A4 em 3 frames
- `mockups/index.html` — índice para navegação entre telas
- `mockups/styles.css` — base visual compartilhada

## Como visualizar

1. Abra a pasta `mockups` no navegador.
2. Clique em `index.html` para acessar o menu de telas.
3. Ou abra qualquer um dos arquivos diretamente no navegador.

### Exemplo no Windows

- Clique duas vezes no arquivo `mockups/index.html`, ou
- Use um servidor local simples:

```bash
cd sistema-qualidade-main
python -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000/mockups/index.html
```

## Observação

Os mockups são estáticos e servem como referência visual para as versões web, tablet e mobile. Não há JavaScript para interação; a ideia é mostrar estrutura, proporção e design system.
