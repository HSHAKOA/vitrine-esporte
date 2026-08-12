# vitrine-esporte — como editar

Template de e-commerce esportivo reutilizável, molde único P&B editorial com
número gigante como elemento de design e personalizador de camisa com preview
ao vivo. Sem framework, sem build — HTML puro + CSS + JS, dados em JSON.

## Estrutura
- `index.html` — Home (hero com vídeo, destaques, personalizador genérico com
  preview ao vivo, lookbook, como funciona)
- `colecao.html` — Catálogo completo, com filtro por categoria e busca
- `produto.html` — Página de produto (`produto.html?p=slug-do-produto`)
- `entrega.html` — Prazo, formas de pagamento, frete
- `contato.html` — WhatsApp, Instagram e formulário de contato
- `css/tokens.css` — só variáveis (cores, espaçamento, tipografia). Tema
  padrão é preto e branco puro (`--accent` = `--ink`).
- `css/base.css` — estrutura e componentes, só usa `var(--...)`, nenhuma cor fixa
- `js/store.js` — catálogo, filtros, sacola, personalizadores, checkout
  WhatsApp, SEO
- `data/produtos.json` — catálogo de produtos
- `data/config.json` — dados da loja (nome, WhatsApp, Instagram, entrega, cor
  da marca, preço da personalização genérica...)
- `sitemap.xml` / `robots.txt` — SEO técnico (ajuste o domínio antes de publicar)

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
- `corDestaque`: troca a cor de marca em todo o site (sobrescreve `--accent`
  via JS). Deixe `null` para o padrão preto e branco do template — é a opção
  recomendada, já que o design foi pensado em P&B. Se quiser colorir a loja,
  passe um hex (ex.: `"#0044FF"`).
- `precoPersonalizacao`: preço fixo do item "Camisa Personalizada" que sai do
  bloco de personalização genérico da Home (`#personalizar`). Esse bloco tem
  preview ao vivo (nome/número/tamanho num SVG) e joga o item direto na mesma
  sacola/checkout do resto da loja.
- `logo`: caminho de uma imagem de logo (ex.: `img/logo/minha-logo.png`). Se
  deixar em branco (`""`), o site usa o nome da loja como wordmark de texto —
  não precisa ter logo pronta pra lançar a loja.
- `colecao`: número e nome da "coleção" atual — alimenta o número gigante do
  hero (`.hero-num`) e o marcador acima do título.
- **Favicon**: não é lido do `config.json`. Cada página HTML tem seu próprio
  `<link rel="icon" ...>` no `<head>` — troque o arquivo em `img/favicon.svg`
  (ou aponte o `href` para outro arquivo) se quiser mudar o ícone da aba.

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
  "imagens": ["img/products/foto.jpg"],
  "descricao": "...",
  "destaque": true
}
```
- `precoPromo: null` quando não há promoção.
- `tamanhosIndisponiveis` marca tamanhos esgotados (aparecem riscados/desabilitados na PDP).
- `personalizavel: true` mostra o bloco de nome/número na página do produto
  (sem preview visual — produtos reais têm fotos, não vetores; o preview ao
  vivo só existe no personalizador genérico da Home).
- `destaque: true` faz o produto aparecer na Home.
- `imagens` pode ser uma lista vazia (`[]`) ou ter um caminho inválido — o
  site sempre cai num ícone-rascunho no lugar, sem quebrar o layout.

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
O template é P&B editorial por padrão — não é preciso mexer em CSS pra
rebrandear a loja, só em `data/config.json` (`corDestaque`, `logo`, `nome`,
`tagline`). Todas as cores do site vêm de `css/tokens.css`; não adicione cor
fixa em nenhum outro arquivo CSS.

## 6. SEO
Cada página define seu próprio `<link rel="canonical">` — ajuste o domínio
(`https://vitrineesporte.exemplo.com.br/...`) para o domínio real antes de
publicar, e faça o mesmo em `sitemap.xml` e `robots.txt`. Título e meta
description de cada página são setados automaticamente por `js/store.js` a
partir de `data/config.json` (a PDP usa o produto exibido).

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
