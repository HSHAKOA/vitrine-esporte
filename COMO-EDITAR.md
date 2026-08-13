# vitrine-esporte — como editar

Template de e-commerce esportivo reutilizável. Design system base estilo
"Nike" (P&B + acentos semânticos fixos), com **cor de marca configurável**
(`corDestaque`) e **fotografia opcional** — sem nada configurado, o site
fica preto-e-branco e o bloco de mídia do produto fica um retângulo vazio
(cor `soft-cloud`, ou `ink` no destaque da home); com `corDestaque` e/ou
`imagens` preenchidos, o site assume a cor da loja e mostra as fotos reais.
Sem framework, sem build — HTML puro + CSS + JS, dados em JSON.

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
  "sobre": "parágrafo curto contando a história/proposta da loja",
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
- `sobre`: parágrafo curto (2-3 frases) sobre a loja, exibido na seção
  "Sobre a loja" da Home — logo depois do destaque, antes da grade de
  produtos. É o espaço reservado pra apresentar a empresa de verdade
  (história, proposta, o que diferencia), não só o catálogo. Se deixar em
  branco, o site usa `descricao` no lugar.
- `corDestaque`: cor de marca da loja, em hex (ex.: `"#FF5A00"`). Sobrescreve
  `--color-accent` (e calcula automaticamente `--color-on-accent` — texto
  preto ou branco, o que der mais contraste) em todos os pontos de destaque
  do site: botão primário, badge da sacola, hero da home, marquee, chip de
  filtro ativo, cartão de prévia da personalização e tamanho selecionado.
  Deixe `null` para manter o visual preto-e-branco padrão do template.
  O resto da paleta (cinzas, `sale`/`success`/`info`) continua fixo — só o
  acento de marca é trocável.
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
- `imagens`: array de caminhos de imagem (ex.: `["img/products/chuteira.jpg"]`).
  Só a primeira posição (`imagens[0]`) é usada — card, sacola e PDP mostram
  a mesma foto. Deixe `[]` para o produto ficar sem foto: nesse caso (e se
  o arquivo referenciado não carregar) o bloco de mídia permanece um
  retângulo vazio `--color-soft-cloud`, sem quebrar o layout.

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
Paleta, tipografia e raios vêm de `css/tokens.css`; não adicione cor fixa
em nenhum outro arquivo CSS. Tudo é editável via `config.json`, exceto
tipografia e raios (esses exigem editar `tokens.css` direto).

- **Paleta**: base fixa em preto (`--color-ink`), branco (`--color-canvas`),
  cinza-claro (`--color-soft-cloud`) e os acentos semânticos fixos —
  vermelho de promoção (`--color-sale`), verde de sucesso
  (`--color-success`), azul de info (`--color-info`). Por cima dessa base,
  `--color-accent`/`--color-on-accent` controlam a cor de marca (ver seção
  1, `corDestaque`) nos pontos de destaque do site — sem `corDestaque`,
  esses dois tokens valem preto/branco e o site fica idêntico ao visual
  "Nike" original.
- **Tipografia**: `Bebas Neue` (títulos grandes/display — carregada via
  Google Fonts, é o substituto usado para a fonte condensada de
  referência) + `Inter` (todo o resto). Se um dia quiserem trocar a fonte
  de display por outra condensada/uppercase, troque o `<link>` do Google
  Fonts no `<head>` de cada página e a variável `--font-display` em
  `css/tokens.css` — nenhum outro arquivo referencia o nome da fonte
  diretamente.
- **Fotografia**: opcional (ver seção 2, `imagens`). Sem foto cadastrada,
  o bloco de mídia fica um retângulo vazio `--color-soft-cloud` (ou
  `--color-ink` no destaque da home) — não é um estado "quebrado", é o
  visual padrão do template pra quem ainda não tem still de produto.

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
