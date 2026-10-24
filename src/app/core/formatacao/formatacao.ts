import { DiaDaSemana, Endereco, Horario } from '../modelos/loja';

const NOMES_DOS_DIAS: Record<DiaDaSemana, string> = {
  sunday: 'domingo',
  monday: 'segunda',
  tuesday: 'terça',
  wednesday: 'quarta',
  thursday: 'quinta',
  friday: 'sexta',
  saturday: 'sábado',
};

/** "+5521974509789" → "(21) 97450-9789". Números fora do padrão brasileiro voltam como vieram. */
export function formatarTelefone(telefone: string): string {
  const numero = /^\+55(\d{2})(\d{4,5})(\d{4})$/.exec(telefone);
  return numero ? `(${numero[1]}) ${numero[2]}-${numero[3]}` : telefone;
}

/** "Rua Afrânio Peixoto, 40 – Santa Luzia, São Gonçalo – RJ" */
export function formatarEndereco(endereco: Endereco): string {
  return `${endereco.logradouro}, ${endereco.numero} – ${endereco.bairro}, ${endereco.cidade} – ${endereco.uf}`;
}

/** Ex.: ["Terça a sexta, das 11h às 19h", "Sábado, das 11h às 16h"]. */
export function formatarHorarios(horarios: Horario[]): string[] {
  return horarios
    .filter((horario) => horario.dias.length > 0)
    .map((horario) => {
      const primeiro = NOMES_DOS_DIAS[horario.dias[0]];
      const ultimo = NOMES_DOS_DIAS[horario.dias[horario.dias.length - 1]];
      const dias = horario.dias.length === 1 ? primeiro : `${primeiro} a ${ultimo}`;
      return `${maiuscula(dias)}, das ${formatarHora(horario.abertura)} às ${formatarHora(horario.fechamento)}`;
    });
}

/** "11:00" → "11h"; "11:30" → "11h30". */
export function formatarHora(hora: string): string {
  const [horas, minutos] = hora.split(':');
  return minutos === '00' ? `${Number(horas)}h` : `${Number(horas)}h${minutos}`;
}

const formatoMoeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** 12.9 → "R$ 12,90" */
export function formatarPreco(valor: number): string {
  return formatoMoeda.format(valor);
}

const formatoDia = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'America/Sao_Paulo',
});

/** Data no fuso da loja. Ex.: "sexta-feira, 23 de outubro". */
export function formatarDia(data: Date): string {
  return formatoDia.format(data);
}

function maiuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
