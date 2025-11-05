const API_URL = "https://back-tcc.vercel.app";

function formatarPreco(valor) {
  return `R$ ${valor.toFixed(2).replace(".", ",")}`;
}

function obterCarrinho() {
  const carrinhoJSON = localStorage.getItem("carrinho");
  return carrinhoJSON ? JSON.parse(carrinhoJSON) : [];
}

function atualizarTabelaCarrinho() {
  const carrinho = obterCarrinho();
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
    const subtotal = preco * quantidade;
    total += subtotal;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><img src="${item.imagem}" alt="${item.nome}" class="img-produto-checkout">${item.nome}</td>
      <td>
        <button class="btn-qtd" onclick="alterarQtd(${idx},-1)">-</button>
        <span class="qtd">${quantidade}</span>
        <button class="btn-qtd" onclick="alterarQtd(${idx},1)">+</button>
      </td>
      <td>${formatarPreco(subtotal)}</td>
      <td><button class="btn-remover" onclick="removerProduto(${idx})"><img src="assets/img/lixo-icon.png" alt="Remover"></button></td>
    `;
    tabela.appendChild(tr);
  });

  totalGeral.textContent = formatarPreco(total);
}

window.alterarQtd = function(idx, delta) {
  let carrinho = obterCarrinho();
  if (carrinho[idx]) {
    carrinho[idx].quantidade = Math.min(Math.max(carrinho[idx].quantidade + delta, 1), 25);
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
    atualizarTabelaCarrinho();
  }
};

window.removerProduto = function(idx) {
  let carrinho = obterCarrinho();
  carrinho.splice(idx, 1);
  localStorage.setItem("carrinho", JSON.stringify(carrinho));
  atualizarTabelaCarrinho();
};

// === Modal de pagamento ===
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
  if (!carrinho.length) { alert("Carrinho vazio."); return; }

  const token = localStorage.getItem("token");
  if (!token) { alert("Você precisa estar logado."); window.location.href = "login.html"; return; }

  let cartao = null;
  if (metodo === "CREDIT_CARD") {
    const nome = document.getElementById("cc-nome").value.trim();
    const numero = document.getElementById("cc-numero").value.replace(/\s+/g, "");
    const validade = document.getElementById("cc-validade").value.split("/");
    const cvv = document.getElementById("cc-cvv").value.trim();

    if (!nome || !numero || !validade[0] || !validade[1] || !cvv) { 
      alert("Preencha todos os campos do cartão."); 
      return; 
    }

    cartao = {
      holderName: nome,
      number: numero,
      expiryMonth: Number(validade[0]),
      expiryYear: Number(validade[1].length === 2 ? "20" + validade[1] : validade[1]),
      cvv
    };
  }

  try {
    // Cria pedido
    const itensParaPedido = carrinho.map(i => ({ produtoId: i.id, quantidade: i.quantidade }));
    const pedidoRes = await fetch(`${API_URL}/pedidos`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ itens: itensParaPedido })
    });
    const pedidoData = await pedidoRes.json();
    if (!pedidoRes.ok) return alert(pedidoData.message || "Erro ao criar pedido.");

    const pedidoId = pedidoData.id;
    if (!pedidoId) return alert("Erro: pedido sem ID retornado.");

    // Gera pagamento
    const pagamentoRes = await fetch(`${API_URL}/pagamentos`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ pedidoId, metodoPagamento: metodo, cartao })
    });
    const pagamentoData = await pagamentoRes.json();
    if (!pagamentoRes.ok) return alert(pagamentoData.message || "Erro ao gerar pagamento.");

    // Tratamento do retorno
    if (pagamentoData.linkPagamento) window.open(pagamentoData.linkPagamento, "_blank");
    else if (pagamentoData.pixQrCode || pagamentoData.pixCopiaCola) {
      localStorage.setItem("pixPagamento", JSON.stringify(pagamentoData));
      alert("PIX gerado! Copie ou escaneie o QR.");
    } else {
      alert("Pagamento iniciado! Aguarde confirmação.");
    }

    // Limpa carrinho
    localStorage.removeItem("carrinho");
    atualizarTabelaCarrinho();

  } catch (err) {
    console.error(err);
    alert("Erro ao processar pagamento.");
  }
};

// Inicializa tabela
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


  window.onload = function() {
    const agendamento = JSON.parse(localStorage.getItem('agendamento'));

    if (agendamento) {
      // Mostra os dados na página
      document.getElementById('checkout-imagem').src = agendamento.imagem;
      document.getElementById('checkout-preco').textContent = `R$ ${agendamento.preco}`;
      document.getElementById('checkout-nome').textContent = `${agendamento.nome} ${agendamento.sobrenome}`;
      document.getElementById('checkout-data').textContent = `${agendamento.data} às ${agendamento.hora}`;
    } else {
      alert('Nenhum agendamento encontrado!');
    }
  };

