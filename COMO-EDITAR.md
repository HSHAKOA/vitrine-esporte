# vitrine-esporte — como editar

Template de e-commerce reutilizável, migrado a partir do site da Salute Sports.
Sem framework, sem build — HTML puro + CSS + JS, dados em JSON.

## Estrutura
- `index.html` — Home (hero, destaques, categorias, FAQ)
- `colecao.html` — Catálogo completo, com filtro por categoria e busca
- `produto.html` — Página de produto (`produto.html?p=slug-do-produto`)
- `entrega.html` — Prazo, formas de pagamento, frete
- `contato.html` — WhatsApp, Instagram e formulário de contato
- `css/tokens.css` — só variáveis (cores, espaçamento, tipografia)
- `css/base.css` — estrutura e componentes, só usa `var(--...)`, nenhuma cor fixa
- `js/store.js` — catálogo, filtros, sacola, personalizador, checkout WhatsApp, SEO
- `data/produtos.json` — catálogo de produtos
- `data/config.json` — dados da loja (nome, WhatsApp, Instagram, entrega, cor da marca...)

## 1. Dados da loja
Edite `data/config.json`:
```json
{
  "nome": "Nome da loja",
  "whatsapp": "5511999998888",
  "instagram": "https://instagram.com/sualoja",
  "cidade": "Cidade, UF",
  "prazoEntrega": "texto livre",
  "pagamentos": ["Pix", "Cartão"],
  "freteGratisAcima": 350,
  "corDestaque": "#FF5A00"
}
```
`corDestaque` troca a cor de marca em todo o site automaticamente (sobrescreve `--accent` de `css/tokens.css` via JS) — não precisa mexer em CSS pra rebrandear a loja.

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
- `personalizavel: true` mostra o bloco de nome/número na página do produto.
- `destaque: true` faz o produto aparecer na Home.
- Se a foto em `imagens[0]` não existir, o site mostra um ícone-rascunho no lugar, sem quebrar.

## 3. Categorias
As categorias são geradas automaticamente a partir do campo `categoria` dos produtos — não
precisa cadastrar em nenhum outro lugar. Para renomear o rótulo exibido, edite
`CATEGORY_LABELS` em `js/store.js`.

## 4. Checkout
O botão "Finalizar pelo WhatsApp" monta a mensagem com todos os itens da sacola (produto,
tamanho, personalização e total) e abre o WhatsApp configurado em `config.json`.

## 5. Como testar localmente
O site carrega os dados via `fetch()`, então **abrir o `index.html` direto com duplo clique
não funciona** (o navegador bloqueia `fetch` em arquivos locais). Rode um servidor simples na
pasta do projeto, por exemplo:
```
npx serve .
```
ou
```
python -m http.server
```
e acesse o endereço indicado (ex.: `http://localhost:3000`). No Netlify isso não é um problema,
o deploy já serve os arquivos via HTTP normalmente.
