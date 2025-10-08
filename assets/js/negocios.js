const main = document.querySelector('#lista-servicos');
let servicos = [];

async function carregarServicos() {
  try {
    // Usando o fetch local do primeiro código; ajuste a URL para a API se necessário (ex: 'https://back-tcc.vercel.app/produtos')
    const res = await fetch("assets/json/negocios.json");
    const data = await res.json();
    servicos = data;
    
    if (!servicos.length) {
      main.innerHTML = "<p>Nenhum serviço disponível.</p>";
      return;
    }
    
    // Limpa o container
    main.innerHTML = '';
    
    // Lógica para imagens (adaptada do segundo código, caso precise de base URL para API)
    const baseUrlImagens = "https://back-tcc.vercel.app/"; // Remova se usando apenas local
    
    servicos.forEach(servico => {
      // Ajusta URL da imagem se necessário (para API)
      let urlImagem = servico.imagem;
      if (!urlImagem.startsWith("http") && baseUrlImagens) {
        urlImagem = baseUrlImagens + urlImagem.replace(/^\/+/, "");
      }
      
      const precoAntigo = servico.precoAntigo ? servico.precoAntigo.toFixed(2).replace('.', ',') : null;
      const preco = servico.preco.toFixed(2).replace('.', ',');

      const card = document.createElement('div');
      card.classList.add('card');

      let precoHTML = `
        <span style="color: #c4520c; font-weight: bold;">R$ ${preco}</span>
      `;
      if (precoAntigo) {
        precoHTML = `
          <span style="text-decoration: line-through; color: gray;">R$ ${precoAntigo}</span><br>
          ${precoHTML}
        `;
      }

      card.innerHTML = `
        <img src="${urlImagem}" alt="${servico.alt || servico.nome}">
        <h2>${servico.nome}</h2>
        <p>${servico.descricao}</p>
        <p>${precoHTML}</p>
        <button class="agendar-button">Ver horários</button>
      `;

      // Adiciona event listener ao botão (melhor que onclick inline)
      const agendarBtn = card.querySelector('.agendar-button');
      agendarBtn.addEventListener('click', () => {
        // Adiciona ao carrinho (função mesclada)
        adicionarAoCarrinho(servico.id, servico.nome, servico.descricao, servico.preco, urlImagem);
        
        // Opcionalmente, armazena o serviço selecionado para uso em horario.html (do primeiro código)
        localStorage.setItem('servicoSelecionado', JSON.stringify(servico));
        
        // Mostra o painel por 5s e depois redireciona (mistura das lógicas)
        setTimeout(() => {
          verHorario();
        }, 5000);
      });

      main.appendChild(card);
    });
  } catch (error) {
    console.error("Erro ao carregar JSON:", error);
    main.innerHTML = "<p>Erro ao carregar serviços.</p>";
  }
}

// Função mesclada para adicionar ao carrinho (combina as duas versões, usando 5000ms como no primeiro)
function adicionarAoCarrinho(id, nome, descricao, preco, imagem) {
    let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
    const index = carrinho.findIndex(item => item.id === id);

    if (index !== -1) {
        carrinho[index].quantidade += 1;
    } else {
        carrinho.push({ id, nome, descricao, preco, imagem, quantidade: 1 });
    }

    localStorage.setItem("carrinho", JSON.stringify(carrinho));
    mostrarPainelLateral(nome, imagem);
}

// Função mesclada para mostrar painel lateral (usa 5000ms do primeiro, mas pode ajustar)
function mostrarPainelLateral(nomeProduto, imagemProduto) {
    const painel = document.getElementById('carrinho-sidebar');
    const textoProduto = document.getElementById('produto-adicionado');
    const imagemElemento = document.createElement('img');

    textoProduto.textContent = nomeProduto;

    const imagemExistente = painel.querySelector('.imagem-produto-adicionado');
    if (imagemExistente) imagemExistente.remove();

    imagemElemento.src = imagemProduto;
    imagemElemento.alt = nomeProduto;
    imagemElemento.classList.add('imagem-produto-adicionado');
    textoProduto.insertAdjacentElement('beforebegin', imagemElemento);

    painel.classList.add('ativo');
    setTimeout(() => painel.classList.remove('ativo'), 5000);
}

function fecharCarrinho() {
    const painel = document.getElementById('carrinho-sidebar');
    painel.classList.remove('ativo');
}

function verHorario() {
    window.location.href = "horario.html";
}

// Animação do menu lateral (do segundo código)
const menuToggle = document.getElementById('menu-toggle');
const slideMenu = document.getElementById('slide-menu');

if (menuToggle && slideMenu) {
    menuToggle.addEventListener('click', () => {
        slideMenu.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });
}

// Carrega os serviços ao inicializar (substitui o fetch original e o carregarProdutos)
carregarServicos();