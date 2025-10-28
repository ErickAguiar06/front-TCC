const API_URL = "https://back-tcc.vercel.app";

document.addEventListener('DOMContentLoaded', () => {

  // === Mostrar/Ocultar senha ===
  function setupToggleSenha(inputId, toggleId) {
    const input = document.getElementById(inputId);
    const toggle = document.getElementById(toggleId);
    let mostrando = false;
    toggle.addEventListener('click', () => {
      mostrando = !mostrando;
      input.type = mostrando ? 'text' : 'password';
    });
  }
  setupToggleSenha('senhaCadastro', 'toggleSenhaCadastro');
  setupToggleSenha('senhaLogin', 'toggleSenhaLogin');

  // === FUNÇÃO AUXILIAR PARA PREVENIR CLIQUES MÚLTIPLOS ===
  function handleSubmit(form, fetchFn, buttonText = "Enviando...") {
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (submitButton.disabled) return;

      submitButton.disabled = true;
      submitButton.textContent = buttonText;

      try {
        await fetchFn(e);
      } catch (err) {
        console.error("❌ Erro no submit:", err);
        alert("Erro de conexão. Tente novamente.");
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    });
  }

  // === LOGIN ===
  const formLogin = document.getElementById('formLogin');
  handleSubmit(formLogin, async () => {
    const email = formLogin.email.value.trim();
    const senha = formLogin.senha.value;

    if (!email || !senha) {
      alert("Email e senha são obrigatórios.");
      return;
    }

    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    let data;
    try {
      data = await response.json();
    } catch {
      alert("Erro ao processar resposta do servidor.");
      return;
    }

    if (response.ok) {
      // SALVA USUARIO NO LOCALSTORAGE (adaptado ao seu backend)
      const usuarioLogado = { email, tipo: data.tipo };
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));

      alert('Login bem-sucedido!');
      window.location.href = "index.html";
    } else {
      alert(data.message || "Email ou senha inválidos.");
    }
  }, "Entrando...");

  // === CADASTRO ===
  const formCadastro = document.getElementById("formCadastro");
  handleSubmit(formCadastro, async () => {
    const nome = formCadastro.nome.value.trim();
    const cpf = formCadastro.cpf.value.trim();
    const email = formCadastro.email.value.trim();
    const telefone = formCadastro.telefone.value.trim();
    const senha = formCadastro.senha.value;

    if (!nome || !cpf || !email || !telefone || !senha) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    const response = await fetch(`${API_URL}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, cpf, email, telefone, senha })
    });

    let data;
    try {
      data = await response.json();
    } catch {
      alert("Erro ao processar resposta do servidor.");
      return;
    }

    if (response.ok) {
      alert("Usuário cadastrado com sucesso!");
      document.getElementById("container").classList.remove("right-panel-active");
      formCadastro.reset();
    } else {
      alert(data.message || "Erro ao cadastrar usuário.");
    }
  }, "Cadastrando...");

  // === Alternar login/cadastro ===
  const signUpButton = document.getElementById("signUp");
  const signInButton = document.getElementById("signIn");
  const container = document.getElementById("container");

  signUpButton.addEventListener("click", () => container.classList.add("right-panel-active"));
  signInButton.addEventListener("click", () => container.classList.remove("right-panel-active"));

  // === MODAL RECUPERAR SENHA ===
  const modalRecuperar = document.getElementById('modalRecuperarSenha');
  const fecharModalRecuperar = document.getElementById('fecharModalRecuperar');
  const formRecuperarSenha = document.getElementById('formRecuperarSenha');
  const linkEsqueceuSenha = document.getElementById('linkEsqueceuSenha');

  // Abrir modal ao clicar em "Esqueceu a senha?"
  linkEsqueceuSenha.addEventListener('click', (e) => {
    e.preventDefault();
    modalRecuperar.style.display = 'block';
  });

  // Fechar modal
  fecharModalRecuperar.addEventListener('click', () => {
    modalRecuperar.style.display = 'none';
  });

  // Fechar modal ao clicar fora
  window.addEventListener('click', (e) => {
    if (e.target === modalRecuperar) {
      modalRecuperar.style.display = 'none';
    }
  });

  // Submit do form de recuperação
 handleSubmit(formRecuperarSenha, async () => {
  const email = formRecuperarSenha.emailRecuperacao.value.trim();
  if (!email) {
    alert("Digite seu email.");
    return;
  }
  console.log("Enviando email para:", email); // Mova para cá (antes do fetch)
  const response = await fetch(`${API_URL}/recuperar-senha`, { 
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });


    let data;
    try {
      data = await response.json();
    } catch {
      alert("Erro ao processar resposta do servidor.");
      return;
    }

    alert(data.message); // Sempre mostra a mensagem (mesmo se email não existir, por segurança)

    if (response.ok) {
      modalRecuperar.style.display = 'none';
      formRecuperarSenha.reset();
    }
    console.log("Enviando email para:", email); // Para debug
  }, "Enviando...");

});

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