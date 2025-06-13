// Arquivo: config.js

// 1. COLE AQUI O OBJETO DE CONFIGURAÇÃO DO SEU PROJETO FIREBASE
export const firebaseConfig = {
  apiKey: "AIzaSyBz-Ujdq2gLUO1xLsmBeQ778LPnE5vDbnk",
  authDomain: "rastreando-gastos.firebaseapp.com",
  projectId: "rastreando-gastos",
  storageBucket: "rastreando-gastos.firebasestorage.app",
  messagingSenderId: "340696630260",
  appId: "1:340696630260:web:14a0b3cef27c94d4a5efa1",
  measurementId: "G-58W8V2J7D8"
};

// 2. Lista de categorias e subcategorias
export const categories = {
    "Alimentação": ["Restaurantes", "Supermercado", "Outros"],
    "Despesas com Filhos": ["Aniversários", "Aulas Extras", "Brinquedos e jogos", "Escola e livros", "Roupas e cuidado Pessoal", "Saúde e Remédios"],
    "Doações": ["Outros", "Igreja e caridade"],
    "Educação e Cursos": ["Mensalidade Escolar", "Livros e materiais de estudo",  "Outros"],
    "Entretenimento / Recreação": ["Brinquedos e jogos", "Cinema e locação de vídeo", "Eventos Culturais", "Férias e Viagens", "Outros"],
    "Impostos e Despesas Bancárias": ["Impostos", "Juros, taxas e tarifas", "Seguros"],
    "Médico e Saúde": ["Médicos e laboratórios", "Remédios"],
    "Moradia": ["Água e esgoto", "Aluguel / Prestação", "Animal de estimação", "Condomínio", "Diarista ou empregada", "Eletricidade e gás", "Manutenção e Limpeza", "Reforma", "Telefone, TV e  internet", "Serviços de assinatura e streaming", "Impostos e seguros", "Outros"],
    "Despesas Pessoais": ["Outros", "Roupas e acessórios", "Beleza e estética"],
    "Diversos": ["Outros", "Presentes"],
    "Transporte": ["Outros", "Gasolina", "Manutenção", "Seguro e impostos", "Transporte Público", "Uber e Aplicativos de Corrida"],
    "Dívidas e Prestações": ["Empréstimos Bancários", "Dívidas com familiares e amigos", "Compras Parceladas", "Financiamentos"]
};
