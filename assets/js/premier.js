// Função para carregar somente produtos da marca Magnus
async function carregarProdutos() {
  try {
    const res = await fetch("https://back-tcc.vercel.app/produtos?marca=Premier");
    const produtos = await res.json();

    const container = document.getElementById("produtos");

    if (!produtos.length) {
      container.innerHTML = "<p>Nenhum produto da Origens disponível.</p>";
      return;
    }

    container.innerHTML = produtos.map(p => `
      <div class="product">
        <img src="${p.imagem}" alt="${p.nome}">
        <p>${p.nome}</p>
        <span class="new-price">R$ ${p.preco.toFixed(2)}</span>
        <button onclick="adicionarAoCarrinho(${p.id}, '${p.nome}', '${p.descricao}', ${p.preco}, '${p.imagem}')">
          Adicionar ao Carrinho
        </button>
      </div>
    `).join("");

  } catch (error) {
    console.error("Erro ao carregar produtos:", error);
  }
}

carregarProdutos();

// Função para adicionar produto ao carrinho
function adicionarAoCarrinho(id, nome, descricao, preco, imagem) {
  let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

  const index = carrinho.findIndex((item) => item.id === id);
  if (index !== -1) {
    carrinho[index].quantidade += 1;
  } else {
    carrinho.push({ id, nome, descricao, preco, imagem, quantidade: 1 });
  }

  localStorage.setItem("carrinho", JSON.stringify(carrinho));
  mostrarPainelLateral(nome, imagem);
}

// Função que exibe o painel lateral ao adicionar produto
function mostrarPainelLateral(nomeProduto, imagemProduto) {
  const painel = document.getElementById('carrinho-sidebar');
  const textoProduto = document.getElementById('produto-adicionado');
  const imagemElemento = document.createElement('img');

  textoProduto.textContent = nomeProduto;

  const imagemExistente = painel.querySelector('.imagem-produto-adicionado');
  if (imagemExistente) {
    imagemExistente.remove();
  }

  imagemElemento.src = imagemProduto;
  imagemElemento.alt = nomeProduto;
  imagemElemento.classList.add('imagem-produto-adicionado');
  textoProduto.insertAdjacentElement('beforebegin', imagemElemento);

  painel.classList.add('ativo');

  setTimeout(() => {
    painel.classList.remove('ativo');
  }, 10000);
}

// Fecha o painel lateral
function fecharCarrinho() {
  const painel = document.getElementById('carrinho-sidebar');
  painel.classList.remove('ativo');
}

// Animação do menu lateral
const menuToggle = document.getElementById('menu-toggle');
const slideMenu = document.getElementById('slide-menu');

menuToggle.addEventListener('click', () => {
  slideMenu.classList.toggle('active');
  menuToggle.classList.toggle('active');
});

