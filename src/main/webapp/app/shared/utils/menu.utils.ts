import { AllergeneDTO, PortataConProdottiDTO } from 'app/shared/model/risto.model';

const ALLERGENE_MANUALE_ICONA = '/content/images/allergene-manuale.png';

export function ordinaPortate(portate: PortataConProdottiDTO[], ordine: Record<string, number>): PortataConProdottiDTO[] {
  return [...portate].sort((a, b) => {
    const oA = a.tipo === 'PERSONALIZZATA' ? 4 : (ordine[a.nomeDefault ?? ''] ?? 99);
    const oB = b.tipo === 'PERSONALIZZATA' ? 4 : (ordine[b.nomeDefault ?? ''] ?? 99);
    return oA - oB;
  });
}

export function getAllergeneIcona(
  a: AllergeneDTO,
  allergeniMap: Map<string, AllergeneDTO>,
  allergeniByNome: Map<string, AllergeneDTO>,
): string {
  if (!a) return '';
  if (a.icona && a.iconaContentType) return `data:${a.iconaContentType};base64,${a.icona}`;
  const c = allergeniMap.get(String(a.id ?? '')) ?? allergeniByNome.get((a.nome ?? '').toLowerCase().trim());
  if (c?.icona && c?.iconaContentType) return `data:${c.iconaContentType};base64,${c.icona}`;
  return ALLERGENE_MANUALE_ICONA;
}

export function formatPrezzo(p: number | undefined | null): string {
  if (p === undefined || p === null) return '\u2014';
  return `\u20AC ${Number(p).toFixed(2).replace('.', ',')}`;
}
