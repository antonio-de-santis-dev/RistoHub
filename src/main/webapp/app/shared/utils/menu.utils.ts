import { AllergeneDTO, PortataConProdottiDTO } from 'app/shared/model/risto.model';

const ALLERGENE_MANUALE_ICONA = '/content/images/allergene-manuale.png';
const ALLERGENI_ICONE_BASE = '/content/images/iconeAlergeni/';

// Mappa nome allergene (lowercase) → nome file immagine
const ALLERGENE_ICONE_MAP: Record<string, string> = {
  glutine: 'Glutine.png',
  crostacei: 'Crostacei.png',
  uova: 'Uova.png',
  pesce: 'Pesce.png',
  arachidi: 'Arachidi.png',
  soia: 'Soia.png',
  latte: 'Latte.png',
  'frutta a guscio': 'Frutta_a_guscio.png',
  sedano: 'Sedano.png',
  senape: 'Senape.png',
  sesamo: 'Sesamo.png',
  'anidride solforosa': 'anidride_solforosa.png',
  lupini: 'lupoli.png',
  molluschi: 'Moluschi.png',
};

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

  // 1. Icona statica per allergeni di default (nome → file locale)
  const nomeKey = (a.nome ?? '').toLowerCase().trim();
  if (ALLERGENE_ICONE_MAP[nomeKey]) {
    return ALLERGENI_ICONE_BASE + ALLERGENE_ICONE_MAP[nomeKey];
  }

  // 2. Allergene custom con icona caricata nel DB (risolto tramite mappa)
  const c = allergeniMap.get(String(a.id ?? '')) ?? allergeniByNome.get(nomeKey);
  if (c?.icona && c?.iconaContentType) return `data:${c.iconaContentType};base64,${c.icona}`;

  // 3. Icona base64 diretta sull'oggetto DTO
  if (a.icona && a.iconaContentType) return `data:${a.iconaContentType};base64,${a.icona}`;

  // 4. Fallback finale: icona manuale generica
  return ALLERGENE_MANUALE_ICONA;
}

export function formatPrezzo(p: number | undefined | null): string {
  if (p === undefined || p === null) return '\u2014';
  return `\u20AC ${Number(p).toFixed(2).replace('.', ',')}`;
}
