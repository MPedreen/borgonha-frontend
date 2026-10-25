import { emReais, mensagemDoPedido } from './mensagem-do-pedido';

describe('mensagemDoPedido', () => {
  it('lista os itens com o subtotal, o total e a forma de pagamento', () => {
    const mensagem = mensagemDoPedido({
      saudacao: 'Olá!\nDesejo fazer meu pedido!',
      linhas: [
        { nome: 'Cookie Nutella', quantidade: 2, subtotalEmCentavos: 3000 },
        { nome: 'Brookie', quantidade: 1, subtotalEmCentavos: 1500 },
      ],
      totalEmCentavos: 4500,
      pagamento: 'pix',
    });

    expect(mensagem).toBe(
      [
        'Olá!',
        'Desejo fazer meu pedido!',
        '',
        '2x Cookie Nutella (R$ 30,00)',
        '1x Brookie (R$ 15,00)',
        '',
        'Valor total: R$ 45,00',
        'Forma de pagamento: Pix',
      ].join('\n'),
    );
  });

  it('funciona sem a mensagem padrão da loja e escreve as formas de pagamento por extenso', () => {
    const mensagem = mensagemDoPedido({
      saudacao: null,
      linhas: [{ nome: 'Bolo de pote – Nutella & Ninho', quantidade: 3, subtotalEmCentavos: 3750 }],
      totalEmCentavos: 3750,
      pagamento: 'credito',
    });

    expect(mensagem.split('\n')).toEqual([
      '3x Bolo de pote – Nutella & Ninho (R$ 37,50)',
      '',
      'Valor total: R$ 37,50',
      'Forma de pagamento: Crédito',
    ]);
  });

  it('escreve os valores em reais com espaço comum', () => {
    expect(emReais(1250)).toBe('R$ 12,50');
    expect(emReais(100000)).toBe('R$ 1.000,00');
  });
});
