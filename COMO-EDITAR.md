# vitrine-esporte — como editar

Template de e-commerce esportivo reutilizável. Design system fixo estilo
"Nike" (P&B + acentos semânticos fixos), **sem fotografia** — onde o
sistema de referência usaria foto de produto, o site mostra um bloco
chapado vazio (cor `soft-cloud`, ou `ink` no destaque da home). Sem
framework, sem build — HTML puro + CSS + JS, dados em JSON.

## Estrutura
- `index.html` — Home (destaque cheio de tela, produtos selecionados,
  categorias, personalizador com feedback tipográfico, como funciona)
- `colecao.html` — Catálogo completo, com filtro por categoria e busca
- `produto.html` — Página de produto (`produto.html?p=slug-do-produto`)
- `entrega.html` — Prazo, formas de pagamento, frete
- `contato.html` — WhatsApp, Instagram e formulário de contato
- `css/tokens.css` — só variáveis (cores, espaçamento, tipografia,
  raios). Paleta fixa — ver seção 5.
- `css/base.css` — estrutura e componentes, só usa `var(--...)`, nenhuma
  cor fixa
- `js/store.js` — catálogo, filtros, sacola, personalizadores, checkout
  WhatsApp, SEO
- `data/produtos.json` — catálogo de produtos
- `data/config.json` — dados da loja (nome, WhatsApp, Instagram, entrega,
  preço da personalização genérica...)
- `sitemap.xml` / `robots.txt` — SEO técnico (ajuste o domínio antes de
  publicar)

## 1. Dados da loja
Edite `data/config.json`:
```json
{
  "nome": "Nome da loja",
  "tagline": "frase curta",
  "descricao": "descrição usada em SEO/hero",
  "whatsapp": "5511999998888",
  "instagram": "https://instagram.com/sualoja",
  "cidade": "Cidade, UF",
  "prazoEntrega": "texto livre",
  "pagamentos": ["Pix", "Cartão"],
  "freteGratisAcima": 350,
  "corDestaque": null,
  "precoPersonalizacao": 149.90,
  "logo": "",
  "greeting": "mensagem inicial do WhatsApp",
  "colecao": { "numero": "01", "nome": "Temporada 26" }
}
```
- `corDestaque`: **nesta versão do template essa chave é ignorada.** O
  sistema de design "Nike" usado aqui é fixo (preto, branco, cinzas e os
  acentos semânticos `sale`/`success`/`info`) — não existe conceito de
  "cor de marca" trocável, ao contrário de moldes anteriores deste
  projeto. A chave continua existindo no JSON só por compatibilidade com
  o molde multi-cliente; pode deixar `null` ou preenchida, não faz
  diferença visual.
- `precoPersonalizacao`: preço fixo do item "Camisa Personalizada" que sai
  do bloco de personalização genérico da Home (`#personalizar`). Esse
  bloco tem feedback **tipográfico** ao vivo (nome/número digitados
  aparecem grandes num cartão preto) — sem desenho de camisa, sem SVG. O
  item entra na mesma sacola/checkout do resto da loja.
- `logo`: caminho de uma imagem de logo (ex.: `img/logo/minha-logo.png`).
  Se deixar em branco (`""`), o site usa o nome da loja como wordmark de
  texto — não precisa ter logo pronta pra lançar a loja. (Essa é a única
  imagem opcional do template, fora do favicon — ver seção 5.)
- `colecao`: número e nome da "coleção" atual, usados no texto acima do
  destaque da home.
- **Favicon**: não é lido do `config.json`. Cada página HTML tem seu
  próprio `<link rel="icon" ...>` no `<head>` — troque o arquivo em
  `img/favicon.svg` (ou aponte o `href` para outro arquivo) se quiser
  mudar o ícone da aba.

## 2. Produtos
Edite `data/produtos.json`. Cada produto:
```json
{
  "sku": "FUT-001",
  "slug": "chuteira-campo-profissional",
  "nome": "...",
  "categoria": "futebol",
  "preco": 399.90,
  "precoPromo": 349.90,
  "tamanhos": ["37","38","39"],
  "tamanhosIndisponiveis": ["38"],
  "personalizavel": true,
  "imagens": [],
  "descricao": "...",
  "destaque": true
}
```
- `precoPromo: null` quando não há promoção.
- `tamanhosIndisponiveis` marca tamanhos esgotados (aparecem riscados/desabilitados na PDP).
- `personalizavel: true` mostra o bloco de nome/número na página do produto.
- `destaque: true` faz o produto aparecer na Home.
- `imagens`: **mantenha sempre `[]`.** Esta versão do template não
  renderiza foto de produto em lugar nenhum (card, sacola, PDP) — o campo
  existe só por compatibilidade com o molde multi-cliente (outras versões
  do template usam fotos reais). Preencher esse array aqui não tem
  efeito: o bloco de mídia é sempre um retângulo vazio.

## 3. Categorias
As categorias são geradas automaticamente a partir do campo `categoria` dos
produtos — não precisa cadastrar em nenhum outro lugar. Para renomear o
rótulo exibido, edite `CATEGORY_LABELS` em `js/store.js`.

## 4. Checkout
O botão "Finalizar pelo WhatsApp" monta a mensagem com todos os itens da
sacola (produto, tamanho, personalização e total) e abre o WhatsApp
configurado em `config.json`. Isso vale tanto para produtos do catálogo
quanto para a "Camisa Personalizada" genérica adicionada pelo bloco da Home.

## 5. Design / marca
O template usa um sistema de design fixo (paleta, tipografia e raios não
são editáveis via `config.json` nesta versão — só nome/tagline/logo).
Todas as cores/raios/espaçamentos vêm de `css/tokens.css`; não adicione
cor fixa em nenhum outro arquivo CSS.

- **Paleta**: fixa. Preto (`--color-ink`), branco (`--color-canvas`),
  cinza-claro (`--color-soft-cloud`) e os acentos semânticos fixos —
  vermelho de promoção (`--color-sale`), verde de sucesso
  (`--color-success`), azul de info (`--color-info`). Não há campo de cor
  de marca nesta versão (ver seção 1, `corDestaque`).
- **Tipografia**: `Bebas Neue` (títulos grandes/display — carregada via
  Google Fonts, é o substituto usado para a fonte condensada de
  referência) + `Inter` (todo o resto). Se um dia quiserem trocar a fonte
  de display por outra condensada/uppercase, troque o `<link>` do Google
  Fonts no `<head>` de cada página e a variável `--font-display` em
  `css/tokens.css` — nenhum outro arquivo referencia o nome da fonte
  diretamente.
- **Sem fotografia**: nenhuma página, componente ou arquivo de dados deste
  template referencia imagem de produto/categoria/atleta. Onde uma foto
  apareceria, há um bloco de cor vazio (`--color-soft-cloud` ou
  `--color-ink`) do tamanho que a foto teria. Isso é proposital, não é um
  estado "quebrado" — não tente reintroduzir fotos apagando esta nota.

## 6. SEO
Cada página define seu próprio `<link rel="canonical">` — ajuste o domínio
(`https://vitrineesporte.exemplo.com.br/...`) para o domínio real antes de
publicar, e faça o mesmo em `sitemap.xml` e `robots.txt`. Título e meta
description de cada página são setados automaticamente por `js/store.js` a
partir de `data/config.json` (a PDP usa o produto exibido). O JSON-LD de
produto (`Product`/`Offer`) não inclui campo `image` — um produto sem foto
é uma entrada válida no schema.org.

## 7. Como testar localmente
O site carrega os dados via `fetch()`, então **abrir o `index.html` direto
com duplo clique não funciona** (o navegador bloqueia `fetch` em arquivos
locais). Rode um servidor simples na pasta do projeto, por exemplo:
```
npx serve .
```
ou
```
python -m http.server
```
e acesse o endereço indicado (ex.: `http://localhost:3000`). No Netlify isso
não é um problema, o deploy já serve os arquivos via HTTP normalmente.
