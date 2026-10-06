let usuarioLogado = null;

const formCadastro = document.getElementById('formCadastro');
const formLogin = document.getElementById('formLogin');
const btnMostrarCadastro = document.getElementById('btnMostrarCadastro');
const btnMostrarLogin = document.getElementById('btnMostrarLogin');
const telaCadastroSucesso = document.getElementById('telaCadastroSucesso');
const btnIrParaLogin = document.getElementById('btnIrParaLogin');

if (btnIrParaLogin && telaCadastroSucesso && formCadastro && formLogin) {
  btnIrParaLogin.addEventListener('click', function () {
    telaCadastroSucesso.hidden = true;
    formLogin.hidden = false;
    formCadastro.hidden = true;
  });
}

if (btnMostrarCadastro && formCadastro && formLogin) {
  btnMostrarCadastro.addEventListener('click', function () {
    formLogin.hidden = true;
    formCadastro.hidden = false;
  });
}

if (btnMostrarLogin && formCadastro && formLogin) {
  btnMostrarLogin.addEventListener('click', function () {
    formCadastro.hidden = true;
    formLogin.hidden = false;
  });
}

if (formCadastro) {
  formCadastro.addEventListener('submit', async function (e) {
    e.preventDefault();

    const nome = document.getElementById('cadNome').value.trim();
    const turma = document.getElementById('cadTurma').value.trim();
    const usuario = document.getElementById('cadUsuario').value.trim();
    const senha = document.getElementById('cadSenha').value;
    const msg = document.getElementById('cadMsg');

    if (!nome || !turma || !usuario || !senha) {
      if (msg) msg.textContent = 'Preencha todos os campos.';
      return;
    }

    const resultado = await cadastrarUsuario(nome, turma, usuario, senha);
    if (resultado.error) {
      if (msg) msg.textContent = 'Erro ao cadastrar. Tente outro nome de usuário.';
      return;
    }

    if (telaCadastroSucesso) {
      document.getElementById('cadSucessoNome').textContent = nome;
      document.getElementById('cadSucessoUsuario').textContent = usuario;
      document.getElementById('cadSucessoTurma').textContent = turma;
      formCadastro.hidden = true;
      formLogin.hidden = true;
      telaCadastroSucesso.hidden = false;
    } else if (msg) {
      msg.textContent = 'Conta criada! Faça login abaixo.';
    }

    e.target.reset();
  });
}

if (formLogin) {
  formLogin.addEventListener('submit', async function (e) {
    e.preventDefault();

    const usuario = document.getElementById('loginUsuario').value.trim();
    const senha = document.getElementById('loginSenha').value;
    const msg = document.getElementById('loginMsg');

    const resultado = await fazerLogin(usuario, senha);
    if (resultado.error) {
      if (msg) msg.textContent = 'Usuário ou senha incorretos.';
      return;
    }

    usuarioLogado = resultado.data;
    sessionStorage.setItem('financapp_usuario', JSON.stringify(usuarioLogado));
    window.location.href = 'conta.html';
  });
}

function mostrarPerfil(usuario) {
  const perfilNome = document.getElementById('perfilNome');
  const perfilTurma = document.getElementById('perfilTurma');
  const perfilFoto = document.getElementById('perfilFoto');

  if (perfilNome && usuario) perfilNome.textContent = usuario.nome || '';
  if (perfilTurma && usuario) perfilTurma.textContent = usuario.turma || '';
  if (perfilFoto && usuario && usuario.foto_url) {
    perfilFoto.src = usuario.foto_url;
  }
}

const btnSair = document.getElementById('btnSair');
if (btnSair) {
  btnSair.addEventListener('click', function () {
    usuarioLogado = null;
    sessionStorage.removeItem('financapp_usuario');
    window.location.href = 'index.html';
  });
}

const usuarioSalvo = sessionStorage.getItem('financapp_usuario');
const telaAuth = document.getElementById('telaAuth');
const telaApp = document.getElementById('telaApp');

if (usuarioSalvo && telaAuth) {
  window.location.replace('conta.html');
} else if (usuarioSalvo && telaApp) {
  try {
    usuarioLogado = JSON.parse(usuarioSalvo);
    if (!usuarioLogado || !usuarioLogado.id) {
      throw new Error('Sessão sem identificador de usuário.');
    }
    mostrarPerfil(usuarioLogado);
    atualizarExtrato();
  } catch (error) {
    console.error('Dados de sessão inválidos:', error);
    sessionStorage.removeItem('financapp_usuario');
    window.location.replace('index.html');
  }
} else if (telaApp) {
  window.location.replace('index.html');
}

async function atualizarExtrato() {
  if (!usuarioLogado || !usuarioLogado.id) {
    return;
  }

  const resultado = await carregarLancamentos(usuarioLogado.id);
  const extratoContainer = document.getElementById('extratoContainer');
  if (!extratoContainer) {
    return;
  }

  extratoContainer.innerHTML = '';

  if (resultado.error) {
    extratoContainer.textContent = 'Erro ao carregar o extrato.';
    return;
  }

  let saldo = 0;
  resultado.data.forEach(function (lancamento) {
    extratoContainer.appendChild(renderLancamento(lancamento));
    if (lancamento.tipo === 'receita') {
      saldo += Number(lancamento.valor);
    } else {
      saldo -= Number(lancamento.valor);
    }
  });

  const saldoValor = document.getElementById('saldoValor');
  if (saldoValor) {
    saldoValor.textContent = saldo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    saldoValor.classList.toggle('positivo', saldo >= 0);
    saldoValor.classList.toggle('negativo', saldo < 0);
  }
}

function renderLancamento(lancamento) {
  const card = document.createElement('div');
  card.className = 'lancamento-card';

  const descricao = document.createElement('p');
  descricao.className = 'lancamento-desc';
  descricao.textContent = lancamento.descricao;

  const data = document.createElement('span');
  data.className = 'lancamento-data';
  data.textContent = new Date(lancamento.criado_em).toLocaleDateString('pt-BR');

  const valor = document.createElement('span');
  valor.className = 'lancamento-valor ' + (lancamento.tipo === 'receita' ? 'receita' : 'despesa');
  const sinal = lancamento.tipo === 'receita' ? '+' : '-';
  valor.textContent = sinal + Number(lancamento.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const tagsDiv = document.createElement('div');
  tagsDiv.className = 'lancamento-tags';
  (lancamento.tags || []).forEach(function (tag) {
    const badge = document.createElement('span');
    badge.className = 'tag-badge';
    badge.textContent = tag;
    tagsDiv.appendChild(badge);
  });

  card.appendChild(descricao);
  card.appendChild(data);
  card.appendChild(valor);
  card.appendChild(tagsDiv);
  return card;
}

const formLancamento = document.getElementById('formLancamento');
if (formLancamento) {
  formLancamento.addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!usuarioLogado || !usuarioLogado.id) {
      return;
    }

    const descricao = document.getElementById('lancDescricao').value.trim();
    const valor = document.getElementById('lancValor').value;
    const tipo = document.getElementById('lancTipo').value;
    const tagsTexto = document.getElementById('lancTags').value;

    if (!descricao || !valor) {
      return;
    }

    const resultado = await criarLancamento(usuarioLogado.id, descricao, valor, tipo);
    if (resultado.error) {
      return;
    }

    const tags = tagsTexto.split(',').map(function (t) { return t.trim(); }).filter(Boolean);
    for (const tag of tags) {
      await adicionarTag(resultado.data.id, tag);
    }

    e.target.reset();
    atualizarExtrato();
  });
}
