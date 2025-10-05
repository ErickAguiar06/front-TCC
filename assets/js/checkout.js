const API_URL = "https://back-tcc.vercel.app"; // Certifique-se de que esta URL está correta para sua API

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
    // Verifique se item.preco e item.quantidade são números válidos
    const preco = parseFloat(item.preco);
    const quantidade = parseInt(item.quantidade);

    if (isNaN(preco) || isNaN(quantidade)) {
      console.error("Item inválido no carrinho:", item);
      return; // Pula este item se for inválido
    }

    const subtotal = preco * quantidade;
    total += subtotal;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>
        <img src="${item.imagem}" alt="${item.nome}" class="img-produto-checkout">
        ${item.nome}
      </td>
      <td>
        <button class="btn-qtd" onclick="alterarQtd(${idx}, -1)">-</button>
        <span class="qtd">${quantidade}</span>
        <button class="btn-qtd" onclick="alterarQtd(${idx}, 1)">+</button>
      </td>
      <td>${formatarPreco(subtotal)}</td>
      <td>
        <button class="btn-remover" onclick="removerProduto(${idx})">
          <img src="assets/img/lixo-icon.png" alt="Remover">
        </button>
      </td>
    `;
    tabela.appendChild(tr);
  });

  totalGeral.textContent = formatarPreco(total);
}

window.alterarQtd = function (idx, delta) {
  let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
  if (carrinho[idx]) { // Garante que o item existe
    carrinho[idx].quantidade = parseInt(carrinho[idx].quantidade) + delta; // Garante que é um número
    if (carrinho[idx].quantidade < 1) carrinho[idx].quantidade = 1;
    if (carrinho[idx].quantidade > 25) carrinho[idx].quantidade = 25; // Limite de quantidade
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

async function iniciarPagamento() {
  const carrinho = obterCarrinho();
  if (carrinho.length === 0) {
    alert("Seu carrinho está vazio.");
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    alert("Você precisa estar logado para finalizar a compra.");
    window.location.href = "login.html";
    return;
  }

  try {
    // ✅ 1. Criar pedido no backend
    // Mapeia o carrinho para o formato esperado pelo backend: { produtoId, quantidade }
    const itensParaPedido = carrinho.map(item => ({
      produtoId: item.id, // Use item.id, que deve ser o ID do produto no banco de dados
      quantidade: item.quantidade,
    }));

    const pedidoResponse = await fetch(`${API_URL}/pedidos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ itens: itensParaPedido }), // Envia os itens mapeados
    });

    const pedidoData = await pedidoResponse.json();
    console.log("📦 Pedido criado:", pedidoData);

    if (!pedidoResponse.ok) {
      alert(pedidoData.erro || pedidoData.message || "Erro ao criar pedido.");
      return;
    }

    const pedidoId = pedidoData.id;

    // ✅ 2. Chamar rota de pagamento com o pedidoId
    const pagamentoResponse = await fetch(`${API_URL}/pagamentos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        pedidoId,
        metodoPagamento: "PIX", // ou "BOLETO", "CREDIT_CARD"
      }),
    });

    const pagamentoData = await pagamentoResponse.json();
    console.log("💳 Resposta do pagamento:", pagamentoData);

    if (!pagamentoResponse.ok) {
      alert(pagamentoData.message || "Erro ao iniciar pagamento.");
      return;
    }

    // ✅ 3. Redirecionar para a tela de pagamento ou link
    if (pagamentoData.pixQrCode || pagamentoData.pixCopiaCola) {
      localStorage.setItem("pixPagamento", JSON.stringify(pagamentoData));
      window.location.href = "pagamento.html";
      return;
    }

    if (pagamentoData.linkPagamento) {
      window.location.href = pagamentoData.linkPagamento;
      return;
    }

    alert("Pagamento iniciado! Aguarde a confirmação.");
  } catch (err) {
    console.error("Erro ao iniciar pagamento:", err);
    alert("Erro ao iniciar pagamento. Tente novamente.");
  }
}


window.irParaPagamento = iniciarPagamento;

document.addEventListener("DOMContentLoaded", atualizarTabelaCarrinho);