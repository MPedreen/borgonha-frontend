import { BOLO_DE_POTE, COOKIE_NUTELLA } from '../../../testing/dados-de-teste';
import { linkDoWhatsApp, nomeNoPedido } from './mensagem-whatsapp';

describe('mensagem do WhatsApp', () => {
  const url = 'https://wa.me/5521974509789';
  const mensagemPadrao = 'Olá!\nDesejo fazer meu pedido!';

  it('gera exatamente o link de pedido da Borgonha', () => {
    expect(linkDoWhatsApp(url, mensagemPadrao, null)).toBe(
      'https://wa.me/5521974509789?text=Ol%C3%A1!%0ADesejo%20fazer%20meu%20pedido!',
    );
  });

  it('acrescenta o produto escolhido na mensagem', () => {
    const link = linkDoWhatsApp(url, mensagemPadrao, COOKIE_NUTELLA);

    expect(decodeURIComponent(link.split('?text=')[1])).toBe(
      'Olá!\nDesejo fazer meu pedido!\nQuero: Cookie Nutella',
    );
  });

  it('só põe "Cookie" antes do nome dos cookies', () => {
    expect(nomeNoPedido(COOKIE_NUTELLA)).toBe('Cookie Nutella');
    expect(nomeNoPedido(BOLO_DE_POTE)).toBe('Bolo de pote');
  });

  it('usa o link puro quando não há mensagem', () => {
    expect(linkDoWhatsApp(url, null, null)).toBe(url);
  });
});
