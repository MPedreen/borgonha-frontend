import { Catalogo, Produto } from '../app/core/modelos/catalogo';
import { Loja } from '../app/core/modelos/loja';

/** Dados de exemplo usados nos testes (fora do build do site). */
export function criarProduto(dados: Partial<Produto> & Pick<Produto, 'slug' | 'nome'>): Produto {
  return {
    categoria: 'cookies',
    descricao: `Descrição do ${dados.nome}.`,
    frase: null,
    preco: null,
    peso: null,
    selo: null,
    variacoes: [],
    imagens: { inteiro: null, partido: null },
    disponivel: true,
    ...dados,
  };
}

export const COOKIE_NUTELLA = criarProduto({
  slug: 'nutella',
  nome: 'Nutella',
  frase: 'Recheado de Nutella. Precisa dizer mais?',
  imagens: {
    inteiro: { caminho: 'cookies/nutella-inteiro', alt: 'Cookie de Nutella visto de cima' },
    partido: { caminho: 'cookies/nutella-partido', alt: 'Cookie de Nutella partido ao meio' },
  },
});

export const COOKIE_RED_VELVET = criarProduto({ slug: 'red-velvet', nome: 'Red Velvet' });

export const BOLO_DE_POTE = criarProduto({
  slug: 'bolo-de-pote',
  nome: 'Bolo de pote',
  categoria: 'doces',
  variacoes: ['Chocolate & Maracujá', 'Nutella & Ninho'],
});

export const COXINHA = criarProduto({
  slug: 'coxinha',
  nome: 'Coxinha de frango com catupiry',
  categoria: 'salgados',
});

export const CATALOGO: Catalogo = {
  categorias: [
    { slug: 'cookies', nome: 'Cookies', produtos: [COOKIE_NUTELLA, COOKIE_RED_VELVET] },
    { slug: 'doces', nome: 'Doces', produtos: [BOLO_DE_POTE] },
    { slug: 'salgados', nome: 'Salgados', produtos: [COXINHA] },
  ],
};

export const LOJA: Loja = {
  nome: 'Borgonha Confeitaria',
  endereco: {
    logradouro: 'Rua Afrânio Peixoto',
    numero: '40',
    bairro: 'Santa Luzia',
    cidade: 'São Gonçalo',
    uf: 'RJ',
    cep: null,
  },
  coordenadas: { latitude: -22.8021494, longitude: -42.9803336 },
  telefone: '+5521974509789',
  instagram: 'borgonhaconfeitaria',
  avisoTopo: 'Frete grátis em Santa Luzia e região pedindo pelo WhatsApp',
  horarios: [
    {
      dias: ['tuesday', 'wednesday', 'thursday', 'friday'],
      abertura: '11:00',
      fechamento: '19:00',
    },
    { dias: ['saturday'], abertura: '11:00', fechamento: '16:00' },
  ],
  canaisPedido: [
    {
      tipo: 'whatsapp',
      titulo: 'Pedir pelo WhatsApp',
      descricao: 'MELHORES PREÇOS, entrega exclusiva em Santa Luzia e região com frete grátis!',
      url: 'https://wa.me/5521974509789',
      mensagemPadrao: 'Olá!\nDesejo fazer meu pedido!',
      selo: null,
      destaque: true,
    },
    {
      tipo: 'ifood',
      titulo: 'Pedir pelo iFood',
      descricao: 'Peça pelo app do iFood.',
      url: 'https://www.ifood.com.br/delivery/sao-goncalo-rj/borgonha-confeitaria-santa-luzia/b5d4336d-e32f-4558-b5f7-10ca4697ace8?UTM_Medium=share',
      mensagemPadrao: null,
      selo: null,
      destaque: false,
    },
    {
      tipo: 'loja-fisica',
      titulo: 'Encontre nossa loja física',
      descricao: 'Rua Afrânio Peixoto, 40 – Santa Luzia, São Gonçalo – RJ',
      url: 'https://maps.app.goo.gl/etqznn6CLoQ8DE68A',
      mensagemPadrao: null,
      selo: null,
      destaque: false,
    },
  ],
};
