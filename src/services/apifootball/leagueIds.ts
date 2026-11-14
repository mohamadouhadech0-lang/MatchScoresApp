/**
 * apifootball.com uses its own league IDs, while the app (Arabic names, featured list, catalog)
 * is keyed by API-Football (api-sports) IDs. Known competitions are recognised by country +
 * league name and given the app ID; any other league gets `UNKNOWN_OFFSET + apifootball id`
 * so IDs never collide.
 */
export const UNKNOWN_OFFSET = 1_000_000;

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9/ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** [app id, country pattern (null = any), league pattern] — first match wins. */
const RULES: [number, RegExp | null, RegExp][] = [
  // Qualifiers before their tournaments so "World Cup" doesn't swallow them.
  [32, null, /world cup.*qualif.*(europe|uefa)|wc qualification europe/],
  [29, null, /world cup.*qualif.*(africa|caf)|wc qualification africa/],
  [30, null, /world cup.*qualif.*(asia|afc)|wc qualification asia/],
  [34, null, /world cup.*qualif.*(south america|conmebol)|wc qualification south america/],
  [36, null, /africa cup of nations.*qualif|afcon.*qualif/],
  [960, null, /euro.*qualif/],
  [1, null, /^(fifa )?world cup( \d{4})?$/],
  [4, null, /^(uefa )?euro( \d{4})?$|^european championship$|^euro championship$/],
  [9, null, /^copa america$/],
  [6, null, /^africa cup of nations$|^afcon$/],
  [5, null, /^uefa nations league/],
  [10, null, /^(international )?friendl(y|ies)( international)?$/],
  [2, null, /^uefa champions league$/],
  [3, null, /^uefa europa league$/],
  [848, null, /^uefa (europa )?conference league$/],
  [17, null, /^afc champions league( elite)?$/],
  [12, null, /^caf champions league$/],
  [39, /^england$/, /^premier league$/],
  [45, /^england$/, /^fa cup$/],
  [140, /^spain$/, /^(la ?liga|primera division)$/],
  [143, /^spain$/, /^copa del rey$/],
  [135, /^italy$/, /^serie a$/],
  [78, /^germany$/, /^bundesliga$/],
  [61, /^france$/, /^ligue 1$/],
  [307, /^saudi arabia$/, /pro league|premier league|saudi league/],
  [233, /^egypt$/, /^premier league$/],
  [200, /^morocco$/, /botola|^pro league$/],
  [186, /^algeria$/, /^(ligue 1|ligue professionnelle 1|division 1)$/],
  [202, /^tunisia$/, /^(ligue 1|ligue professionnelle 1)$/],
  [301, /^(united arab emirates|uae)$/, /pro league|arabian gulf league/],
  [305, /^qatar$/, /stars league/],
];

/** Learned while parsing responses: app id → apifootball id (needed for standings / scorers). */
const toProvider = new Map<number, string>();

export function appLeagueId(providerId: string, country: string, league: string): number {
  const c = norm(country);
  const l = norm(league);
  const rule = RULES.find(([, cp, lp]) => (!cp || cp.test(c)) && lp.test(l));
  const id = rule ? rule[0] : UNKNOWN_OFFSET + Number(providerId);
  if (!toProvider.has(id)) toProvider.set(id, providerId);
  return id;
}

/** apifootball id for an app league id, if known (unknown leagues are decoded directly). */
export function providerLeagueId(appId: number): string | undefined {
  if (appId >= UNKNOWN_OFFSET) return String(appId - UNKNOWN_OFFSET);
  return toProvider.get(appId);
}
