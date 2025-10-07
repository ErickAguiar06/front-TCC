// =============================
// CONFIGURAÇÃO DA API
// =============================
const API_URL = "https://back-tcc.vercel.app";

// ------- Usuários -------
async function cadastrarUsuario(dados) {
  const res = await fetch(`${API_URL}/usuarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  return res.json();
}

async function loginUsuario(email, senha) {
  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });
  return res.json();
}

// ------- Produtos -------
async function listarProdutos() {
  const res = await fetch(`${API_URL}/produtos`);
  return res.json();
}

// ------- Pedidos -------
async function criarPedido(dados) {
  const res = await fetch(`${API_URL}/pedidos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dados),
  });
  return res.json();
}

// =============================
// CARROSSEL DE SERVIÇOS (cards)
// =============================
const carousel = {
  currentIndex: 0,
  init() {
    this.track = document.getElementById("carouselTrack");
    this.cardWidth = this.track && this.track.querySelector(".carousel-card")
      ? this.track.querySelector(".carousel-card").offsetWidth + 20
      : 420;
  },
  move(direction) {
    if (!this.track) return;
    const totalCards = this.track.querySelectorAll(".carousel-card").length;
    const visibleCards = Math.floor(this.track.parentElement.offsetWidth / this.cardWidth);

    this.currentIndex += direction;
    if (this.currentIndex < 0) this.currentIndex = 0;
    if (this.currentIndex > totalCards - visibleCards) this.currentIndex = totalCards - visibleCards;

    this.track.style.transform = `translateX(-${this.currentIndex * this.cardWidth}px)`;
    this.track.style.transition = "transform 0.3s";
  }
};

// =============================
// CARROSSEL DE PRODUTOS
// =============================
const productsCarousel = {
  currentIndex: 0,
  track: null,
  cardWidth: 270,
  move(direction) {
    if (!this.track) return;
    const productCards = this.track.querySelectorAll(".product");
    this.cardWidth = productCards[0] ? productCards[0].offsetWidth + 20 : 270;
    const visibleCards = Math.floor(this.track.parentElement.offsetWidth / this.cardWidth);

    this.currentIndex += direction;
    if (this.currentIndex < 0) this.currentIndex = 0;
    const maxIndex = Math.max(productCards.length - visibleCards, 0);
    if (this.currentIndex > maxIndex) this.currentIndex = maxIndex;

    this.track.style.transform = `translateX(-${this.currentIndex * this.cardWidth}px)`;
    this.track.style.transition = "transform 0.3s";
  }
};

// =============================
// CARROSSEL DE BANNERS (slides + dots + autoplay)
// =============================
const bannerCarousel = {
  currentIndex: 0,
  autoPlay: null,
  init() {
    this.carousel = document.querySelector(".carousel");
    if (!this.carousel) return;

    this.track = this.carousel.querySelector(".carousel-track");
    this.slides = Array.from(this.track.children);
    this.dots = this.carousel.querySelectorAll(".carousel-indicators .dot");

    this.showSlide(this.currentIndex);
    this.startAutoPlay();
  },
  showSlide(index) {
    this.track.style.transform = `translateX(-${index * 100}%)`;
    if (this.dots.length) {
      this.dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
    }
  },
  nextSlide() {
    this.currentIndex = (this.currentIndex + 1) % this.slides.length;
    this.showSlide(this.currentIndex);
  },
  startAutoPlay() {
    this.autoPlay = setInterval(() => this.nextSlide(), 5000);
  }
};

// =============================
// CARRINHO (localStorage)
// =============================
function adicionarAoCarrinho(id, nome, preco) {
  let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
  const index = carrinho.findIndex(item => item.id === id);

  if (index !== -1) {
    carrinho[index].quantidade++;
  } else {
    carrinho.push({ id, nome, preco, quantidade: 1 });
  }

  localStorage.setItem("carrinho", JSON.stringify(carrinho));
  alert(`${nome} foi adicionado ao carrinho!`);
}

// =============================
// CARREGAR PRODUTOS DO BACK
// =============================
async function carregarProdutos() {
  try {
    const produtos = await listarProdutos();
    const track = document.getElementById("productsTrack");
    productsCarousel.track = track;

    if (!track) return;

    track.innerHTML = ""; // limpar produtos estáticos

    produtos.forEach(prod => {
      const div = document.createElement("div");
      div.classList.add("product");
      div.innerHTML = `
        <img src="${prod.imagem}" alt="${prod.nome}">
        <p>${prod.nome}</p>
        <span>R$ ${prod.preco}</span>
        <a href="#" class="btn" onclick="adicionarAoCarrinho(${prod.id}, '${prod.nome}', ${prod.preco})">Adicionar ao Carrinho</a>
      `;
      track.appendChild(div);
    });
  } catch (error) {
    console.error("Erro ao carregar produtos:", error);
  }
}

// === PERFIL / LOGOUT ===
const perfilContainer = document.getElementById("perfil-container");
const modalPerfil = document.getElementById("modal-perfil");
const fecharPerfil = document.getElementById("fechar-perfil");
const perfilEmail = document.getElementById("perfil-email");
const btnLogout = document.getElementById("btn-logout");

// Mostrar modal ao clicar no perfil
perfilContainer.onclick = () => {
  const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
  if(usuario && usuario.email){
    perfilEmail.textContent = usuario.email;
    modalPerfil.style.display = "flex";
  } else {
    alert("Usuário não logado.");
  }
};

// Fechar modal
fecharPerfil.onclick = () => modalPerfil.style.display = "none";
window.onclick = (e) => { if(e.target === modalPerfil) modalPerfil.style.display = "none"; };

// Logout
btnLogout.onclick = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("usuarioLogado");
  window.location.href = "login.html";
};

// Mostrar email resumido no header
const usuario = JSON.parse(localStorage.getItem("usuarioLogado"));
if(usuario && usuario.email){
  document.getElementById("perfil-nome").textContent = usuario.email.split("@")[0];
}

// =============================
// INICIALIZAÇÃO
// =============================
function moveCarousel(direction) {
  carousel.move(direction);
}
document.addEventListener("DOMContentLoaded", () => {
  carousel.init();
  productsCarousel.track = document.getElementById("productsTrack");
  carregarProdutos();
  bannerCarousel.init();
});
