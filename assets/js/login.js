const API_URL = "https://back-tcc.vercel.app";

document.addEventListener('DOMContentLoaded', () => {
  /* === Mostrar/Ocultar senha === */
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

  /* === FUNÇÃO AUXILIAR PARA PREVENIR CLIQUES MÚLTIPLOS (MELHORADA) === */
  function handleSubmit(form, fetchFn, successCallback, buttonText = "Enviando...") {
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Previne cliques múltiplos
      if (submitButton.disabled) return;
      submitButton.disabled = true;
      submitButton.textContent = buttonText;

      let response;
      let data;
      try {
        // Executa a função de fetch
        await fetchFn(e);
        
        // ✅ Aqui, assumimos que fetchFn já faz o fetch e retorna se ok ou não
        // Mas para debug, vamos capturar explicitamente dentro de fetchFn
      } catch (error) {
        console.error("❌ Erro no submit (rede ou parsing):", error);
        alert("Erro de conexão. Verifique sua internet e tente novamente.");
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    });
  }

  /* === LOGIN === */
  const formLogin = document.getElementById('formLogin');
  handleSubmit(formLogin, async (e) => {
    const email = formLogin.email.value.trim();
    const senha = formLogin.senha.value;
    
    console.log("🔍 Tentativa de login - Email:", email); // Debug no navegador

    if (!email || !senha) {
      alert("Email e senha são obrigatórios.");
      return;
    }

    const dados = { email, senha };

    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });

    console.log("📡 Resposta do login - Status:", response.status, "OK?", response.ok); // Debug

    let data;
    try {
      data = await response.json();
      console.log("📄 Dados da resposta:", data); // Debug (sem senha)
    } catch (parseError) {
      console.error("❌ Erro ao parsear JSON da resposta:", parseError);
      alert("Erro ao processar resposta do servidor.");
      return;
    }

    if (response.ok) {
      localStorage.setItem('token', data.token);
      alert('Login bem-sucedido!');
      window.location.href = "index.html";
    } else {
      // Mensagens específicas
      let mensagem = data.message || 'Email ou senha inválidos.';
      if (response.status === 500) {
        mensagem = 'Erro no servidor. Tente novamente em alguns minutos.';
      } else if (response.status === 401) {
        mensagem = 'Email ou senha inválidos.';
      } else if (response.status === 400) {
        mensagem = 'Email e senha são obrigatórios.';
      }
      console.log("❌ Erro no login:", mensagem); // Debug
      alert(mensagem);
    }
  }, null, "Entrando...");

  /* === CADASTRO === */
  const formCadastro = document.getElementById("formCadastro");
  handleSubmit(formCadastro, async (e) => {
    const nome = e.target.nome.value.trim();
    const cpf = e.target.cpf.value.trim();
    const email = e.target.email.value.trim();
    const telefone = e.target.telefone.value.trim();
    const senha = e.target.senha.value;

    console.log("🔍 Tentativa de cadastro - Dados:", { nome, cpf: cpf.substring(0,3)+'...', email, telefone }); // Debug (mascara CPF/senha)

    if (!nome || !cpf || !email || !telefone || !senha) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    const response = await fetch(`${API_URL}/usuarios`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, cpf, email, telefone, senha }),
    });

    console.log("📡 Resposta do cadastro - Status:", response.status, "OK?", response.ok); // Debug

    let data;
    try {
      data = await response.json();
      console.log("📄 Dados da resposta:", data); // Debug
    } catch (parseError) {
      console.error("❌ Erro ao parsear JSON da resposta:", parseError);
      alert("Erro ao processar resposta do servidor.");
      return;
    }

    if (response.ok) {
      alert("Usuário cadastrado com sucesso!");
      document.getElementById("container").classList.remove("right-panel-active"); // Volta para login
      formCadastro.reset(); // Limpa o form
    } else {
      // Mensagens específicas
      let mensagem = data.message || "Erro ao cadastrar.";
      if (response.status === 409) {
        mensagem = "E-mail ou CPF já cadastrado. Faça login.";
      } else if (response.status === 400) {
        mensagem = data.message || "Preencha os campos corretamente.";
      }
      console.log("❌ Erro no cadastro:", mensagem); // Debug
      alert(mensagem);
    }
  }, null, "Cadastrando...");

  /* === Alternar entre login/cadastro === */
  const signUpButton = document.getElementById("signUp");
  const signInButton = document.getElementById("signIn");
  const container = document.getElementById("container");

  signUpButton.addEventListener("click", () => container.classList.add("right-panel-active"));
  signInButton.addEventListener("click", () => container.classList.remove("right-panel-active"));

  /* === Recuperar senha === (mantido igual, mas com debug se quiser) */
  const esqueceuSenha = document.getElementById("esqueceuSenha");
  const modalRecuperarSenha = document.getElementById("modalRecuperarSenha");
  const fecharModalRecuperar = document.getElementById("fecharModalRecuperar");
  const formRecuperarSenha = document.getElementById("formRecuperarSenha");

  esqueceuSenha.addEventListener("click", (e) => {
    e.preventDefault();
    modalRecuperarSenha.style.display = "flex";
  });
  fecharModalRecuperar.addEventListener("click", () => modalRecuperarSenha.style.display = "none");
  modalRecuperarSenha.addEventListener("click", (e) => {
    if (e.target === modalRecuperarSenha) modalRecuperarSenha.style.display = "none";
  });

  formRecuperarSenha.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = formRecuperarSenha.emailRecuperacao.value.trim();
    if (!email) {
      alert("Por favor, insira seu email.");
      return;
    }
    try {
      const response = await fetch(`${API_URL}/recuperar-senha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'Se o email estiver cadastrado, você receberá um link.');
        modalRecuperarSenha.style.display = 'none';
        formRecuperarSenha.reset();
      } else {
        alert(data.error || 'Erro ao solicitar recuperação.');
      }
    } catch {
      alert('Erro ao solicitar recuperação.');
    }
  });
});