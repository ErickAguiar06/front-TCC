document.addEventListener("DOMContentLoaded", () => {
  const dados = JSON.parse(localStorage.getItem("pixPagamento"));
  if (!dados) {
    alert("Dados de pagamento não encontrados.");
    window.location.href = "checkout.html";
    return;
  }

  if (dados.pixQrCode || dados.pixCopiaCola) {
    document.getElementById("pix-container").style.display = "block";
    if (dados.pixQrCode) {
      document.getElementById("pix-qr").src = dados.pixQrCode;
    }
    if (dados.pixCopiaCola) {
      document.getElementById("pix-copia").value = dados.pixCopiaCola;
    }
  }

  if (dados.linkPagamento) {
    document.getElementById("link-container").style.display = "block";
    document.getElementById("link-pagamento").href = dados.linkPagamento;
  }
});

function copiar() {
  const textArea = document.getElementById("pix-copia");
  textArea.select();
  navigator.clipboard.writeText(textArea.value)
    .then(() => alert("Código PIX copiado!"))
    .catch(() => alert("Erro ao copiar código PIX."));
}
