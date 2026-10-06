async function cadastrarUsuario(nome, turma, usuario, senha) {
  const { data, error } = await supabaseClient
    .from('usuarios')
    .insert([{ nome: nome, turma: turma, usuario: usuario, senha: senha }])
    .select();

  if (error) {
    console.error(error);
    return { data: null, error: error };
  }

  console.log('Usuário cadastrado:', data);
  return { data: data, error: null };
}


async function fazerLogin(usuario, senha) {
  const { data, error } = await supabaseClient
    .from('usuarios')
    .select('*')
    .eq('usuario', usuario)
    .eq('senha', senha)
    .maybeSingle();

  if (error) {
    console.error(error);
    return { data: null, error: error };
  }

  if (!data) {
    return { data: null, error: { message: 'Usuário ou senha incorretos.' } };
  }

  console.log('Login ok:', data);
  return { data: data, error: null };
}


async function criarLancamento(autorId, descricao, valor, tipo) {
  const { data, error } = await supabaseClient
    .from('lancamentos')
    .insert([{ autor_id: autorId, descricao: descricao, valor: Number(valor), tipo: tipo }])
    .select()
    .single();

  if (error) {
    console.error(error);
    return { data: null, error: error };
  }

  console.log('Lançamento criado:', data);
  return { data: data, error: null };
}


async function carregarLancamentos(autorId) {
  const { data, error } = await supabaseClient
    .from('lancamentos')
    .select('*, lancamento_tags(tags(nome))')
    .eq('autor_id', autorId)
    .order('criado_em', { ascending: false });

  if (error) {
    console.error(error);
    return { data: [], error: error };
  }

  const lancamentos = data.map(function (lancamento) {
    const tags = (lancamento.lancamento_tags || []).map(function (lt) {
      return lt && lt.tags ? lt.tags.nome : null;
    }).filter(Boolean);

    return Object.assign({}, lancamento, { tags: tags });
  });

  return { data: lancamentos, error: null };
}


async function adicionarTag(lancamentoId, nomeTag) {
  const nome = nomeTag.trim().toLowerCase();
  if (!nome) {
    return { data: null, error: { message: 'Tag vazia.' } };
  }

  let tag = null;
  const busca = await supabaseClient
    .from('tags')
    .select('*')
    .eq('nome', nome)
    .maybeSingle();

  if (busca.error) {
    console.error(busca.error);
    return { data: null, error: busca.error };
  }
  tag = busca.data;

  if (!tag) {
    const criacao = await supabaseClient
      .from('tags')
      .insert([{ nome: nome }])
      .select()
      .single();

if (criacao.error) {
  console.error(criacao.error);
  return { data: null, error: criacao.error };
}
tag = criacao.data;
}

const { data, error } = await supabaseClient
  .from('lancamento_tags')
  .insert([{ lancamento_id: lancamentoId, tag_id: tag.id }])
  .select();

if (error) {
  if (error.code === '23505') {
    console.warn('Essa tag já estava nesse lançamento.');
    return { data: null, error: null };
  }
  console.error(error);
  return { data: null, error: error };
}

return { data: null, error: null };
}