import { LOJA } from '../../../testing/dados-de-teste';
import { montarDadosEstruturados } from './dados-estruturados';

describe('montarDadosEstruturados', () => {
  it('descreve a confeitaria para o Google (endereço, horários e redes)', () => {
    const [confeitaria] = montarDadosEstruturados(LOJA, [], '') as Record<string, unknown>[];

    expect(confeitaria).toMatchObject({
      '@type': 'Bakery',
      name: 'Borgonha Confeitaria',
      telephone: '+5521974509789',
      address: {
        streetAddress: 'Rua Afrânio Peixoto, 40 – Santa Luzia',
        addressLocality: 'São Gonçalo',
      },
      openingHoursSpecification: [
        {
          dayOfWeek: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          opens: '11:00',
          closes: '19:00',
        },
        { dayOfWeek: ['Saturday'], opens: '11:00', closes: '16:00' },
      ],
    });
    expect(confeitaria['sameAs']).toContain('https://www.instagram.com/borgonhaconfeitaria/');
    expect(confeitaria['url']).toBeUndefined();
  });

  it('inclui o endereço do site quando o domínio está configurado', () => {
    const [confeitaria] = montarDadosEstruturados(LOJA, [], 'https://www.exemplo.com.br') as Record<
      string,
      unknown
    >[];

    expect(confeitaria['url']).toBe('https://www.exemplo.com.br');
    expect(confeitaria['image']).toBe('https://www.exemplo.com.br/og-imagem.jpg');
  });

  it('gera as perguntas frequentes quando existem', () => {
    const dados = montarDadosEstruturados(
      LOJA,
      [{ pergunta: 'O frete é grátis?', resposta: 'Sim!' }],
      '',
    );

    expect(dados).toHaveLength(2);
    expect(dados[1]).toMatchObject({
      '@type': 'FAQPage',
      mainEntity: [{ name: 'O frete é grátis?', acceptedAnswer: { text: 'Sim!' } }],
    });
  });
});
