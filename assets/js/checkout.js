const API_URL = "https://back-tcc.vercel.app";

function formatarPreco(valor) {
  return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}

function atualizarTabelaCarrinho() {
  const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
  const tabela = document.getElementById("tabela-produtos");
  const totalGeral = document.getElementById("total-geral");
  tabela.innerHTML = "";
  let total = 0;

  if (carrinho.length === 0) {
    tabela.innerHTML = '<tr><td colspan="4" class="text-center">Seu carrinho está vazio.</td></tr>';
    totalGeral.textContent = formatarPreco(0);
    return;
  }

  carrinho.forEach((item, idx) => {
    const preco = parseFloat(item.preco);
    const quantidade = parseInt(item.quantidade);
    if (isNaN(preco) || isNaN(quantidade)) {
      console.error("Item inválido:", item);
      return;
    }
    const subtotal = preco * quantidade;
    total += subtotal;

    const tr = document.createElement("tr");
    tr.innerHTML = `<td><img src="${item.imagem}" alt="${item.nome}" class="img-produto-checkout">${item.nome}</td>
    <td><button class="btn-qtd" onclick="alterarQtd(${idx},-1)">-</button><span class="qtd">${quantidade}</span><button class="btn-qtd" onclick="alterarQtd(${idx},1)">+</button></td>
    <td>${formatarPreco(subtotal)}</td>
    <td><button class="btn-remover" onclick="removerProduto(${idx})"><img src="assets/img/lixo-icon.png" alt="Remover"></button></td>`;
    tabela.appendChild(tr);
  });
  totalGeral.textContent = formatarPreco(total);
}

window.alterarQtd = function (idx, delta) {
  let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
  if (carrinho[idx]) {
    carrinho[idx].quantidade = parseInt(carrinho[idx].quantidade) + delta;
    if (carrinho[idx].quantidade < 1) carrinho[idx].quantidade = 1;
    if (carrinho[idx].quantidade > 25) carrinho[idx].quantidade = 25;
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
    atualizarTabelaCarrinho();
  }
};

window.removerProduto = function (idx) {
  let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
  carrinho.splice(idx, 1);
  localStorage.setItem("carrinho", JSON.stringify(carrinho));
  atualizarTabelaCarrinho();
};

function obterCarrinho() {
  const carrinhoJSON = localStorage.getItem("carrinho");
  return carrinhoJSON ? JSON.parse(carrinhoJSON) : [];
}

// Modal
const modal = document.getElementById("modal-pagamento");
const fecharModal = document.getElementById("fechar-modal");
const btnPagar = document.getElementById("btn-pagar");
const btnConfirmar = document.getElementById("btn-confirmar-pagamento");
const selectMetodo = document.getElementById("metodoPagamento");
const cartaoForm = document.getElementById("cartao-form");

btnPagar.onclick = () => modal.style.display = "flex";
fecharModal.onclick = () => modal.style.display = "none";
window.onclick = e => { if (e.target === modal) modal.style.display = "none"; };

selectMetodo.onchange = () => cartaoForm.classList.toggle("hidden", selectMetodo.value !== "CREDIT_CARD");

btnConfirmar.onclick = async () => {
  const metodo = selectMetodo.value;
  modal.style.display = "none";

  const carrinho = obterCarrinho();
  if (carrinho.length === 0) { alert("Carrinho vazio."); return; }
  const token = localStorage.getItem("token");
  if (!token) { alert("Você precisa estar logado."); window.location.href = "login.html"; return; }

  // Prepara dados do cartão se necessário
  let cartao = null;
  if (metodo === "CREDIT_CARD") {
    const nome = document.getElementById("cc-nome").value.trim();
    const numero = document.getElementById("cc-numero").value.replace(/\s+/g, "");
    const [mes, ano] = document.getElementById("cc-validade").value.split("/");
    const cvv = document.getElementById("cc-cvv").value.trim();

    if (!nome || !numero || !mes || !ano || !cvv) { alert("Preencha todos os campos do cartão."); return; }

    cartao = {
      holderName: nome,
      number: numero,
      expiryMonth: Number(mes),
      expiryYear: Number(ano.length === 2 ? "20" + ano : ano),
      cvv
    };
  }

  try {
    const itensParaPedido = carrinho.map(i => ({ produtoId: i.id, quantidade: i.quantidade }));
    const pedidoRes = await fetch(`${API_URL}/pedidos`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itens: itensParaPedido })
    });
    const pedidoData = await pedidoRes.json();
    if (!pedidoRes.ok) return alert(pedidoData.message || "Erro ao criar pedido.");
    const pedidoId = pedidoData.id;

    const pagamentoRes = await fetch(`${API_URL}/pagamentos`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ pedidoId, metodoPagamento: metodo, cartao: cartao })
    });
    const pagamentoData = await pagamentoRes.json();
    if (!pagamentoRes.ok) return alert(pagamentoData.message || "Erro ao gerar pagamento.");

    if (pagamentoData.linkPagamento) window.open(pagamentoData.linkPagamento, "_blank");
    else if (pagamentoData.pixQrCode || pagamentoData.pixCopiaCola) {
      localStorage.setItem("pixPagamento", JSON.stringify(pagamentoData));
      alert("PIX gerado! Copie ou escaneie o QR.");
    }
    else alert("Pagamento iniciado! Aguarde confirmação.");

  } catch (err) {
    console.error(err);
    alert("Erro ao processar pagamento.");
  }
};

document.addEventListener("DOMContentLoaded", atualizarTabelaCarrinho);


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
