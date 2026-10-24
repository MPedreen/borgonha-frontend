import { DOCUMENT } from '@angular/common';
import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Duvida } from '../modelos/duvida';
import { DiaDaSemana, Loja } from '../modelos/loja';

const ID_DO_SCRIPT = 'dados-estruturados';

const DIAS_SCHEMA_ORG: Record<DiaDaSemana, string> = {
  sunday: 'Sunday',
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
};

/**
 * Dados estruturados (schema.org) da confeitaria e das perguntas frequentes,
 * que ajudam o Google a mostrar endereço, horários e dúvidas nos resultados.
 */
export function montarDadosEstruturados(loja: Loja, duvidas: Duvida[], siteUrl: string): object[] {
  const confeitaria = {
    '@context': 'https://schema.org',
    '@type': 'Bakery',
    name: loja.nome,
    telephone: loja.telefone,
    ...(siteUrl ? { url: siteUrl, image: `${siteUrl}/og-imagem.jpg` } : {}),
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${loja.endereco.logradouro}, ${loja.endereco.numero} – ${loja.endereco.bairro}`,
      addressLocality: loja.endereco.cidade,
      addressRegion: loja.endereco.uf,
      ...(loja.endereco.cep ? { postalCode: loja.endereco.cep } : {}),
      addressCountry: 'BR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: loja.coordenadas.latitude,
      longitude: loja.coordenadas.longitude,
    },
    openingHoursSpecification: loja.horarios.map((horario) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: horario.dias.map((dia) => DIAS_SCHEMA_ORG[dia]),
      opens: horario.abertura,
      closes: horario.fechamento,
    })),
    sameAs: [
      ...(loja.instagram ? [`https://www.instagram.com/${loja.instagram}/`] : []),
      ...loja.canaisPedido.filter((canal) => canal.tipo !== 'whatsapp').map((canal) => canal.url),
    ],
  };

  if (duvidas.length === 0) {
    return [confeitaria];
  }

  const perguntasFrequentes = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: duvidas.map((duvida) => ({
      '@type': 'Question',
      name: duvida.pergunta,
      acceptedAnswer: { '@type': 'Answer', text: duvida.resposta },
    })),
  };

  return [confeitaria, perguntasFrequentes];
}

/** Grava os dados estruturados no <head> (na pré-renderização eles já saem no HTML). */
@Service()
export class DadosEstruturados {
  private readonly documento = inject(DOCUMENT);

  atualizar(loja: Loja, duvidas: Duvida[]): void {
    let script = this.documento.getElementById(ID_DO_SCRIPT);
    if (!script) {
      script = this.documento.createElement('script');
      script.id = ID_DO_SCRIPT;
      script.setAttribute('type', 'application/ld+json');
      this.documento.head.appendChild(script);
    }
    script.textContent = JSON.stringify(
      montarDadosEstruturados(loja, duvidas, environment.siteUrl),
    );
  }
}
