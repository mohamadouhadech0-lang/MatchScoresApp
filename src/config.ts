/**
 * Temporary switch: EXPO_PUBLIC_USE_MOCK_DATA=true forces the local demo data even when a key is
 * set (e.g. while the provider account is being activated). Remove it to use the real API again.
 */
export const forceMockData = process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true';
const apiFootballKey = forceMockData ? '' : (process.env.EXPO_PUBLIC_API_FOOTBALL_KEY ?? '');

export const config = {
  /**
   * apifootball.com key, read from `.env.local` (EXPO_PUBLIC_API_FOOTBALL_KEY). Empty → mock data.
   * NOTE: EXPO_PUBLIC_* values are bundled into the app binary. For a public release,
   * route requests through your own backend instead of shipping the key.
   */
  apiFootballKey,

  /** True when screens are showing real apifootball.com data. */
  usingRealData: apiFootballKey.length > 0,

  /**
   * League IDs shown first on the matches tab, in display order. These are the app's canonical
   * (api-sports) IDs; apifootball.com leagues are mapped to them in services/apifootball/leagueIds.ts.
   * Internationals first (busy during international breaks), then top leagues and Arab leagues.
   */
  featuredLeagueIds: [
    1, // World Cup
    4, // Euro
    9, // Copa América
    6, // Africa Cup of Nations
    5, // UEFA Nations League
    32, // WC Qualification Europe
    29, // WC Qualification Africa
    30, // WC Qualification Asia
    34, // WC Qualification South America
    36, // AFCON Qualification
    10, // International friendlies
    2, // Champions League
    3, // Europa League
    848, // Conference League
    17, // AFC Champions League
    12, // CAF Champions League
    39, // Premier League
    140, // La Liga
    135, // Serie A
    78, // Bundesliga
    61, // Ligue 1
    307, // Saudi Pro League
    233, // Egyptian Premier League
    200, // Botola Pro (Morocco)
    186, // Ligue 1 (Algeria)
    202, // Ligue 1 (Tunisia)
    301, // UAE Pro League
    305, // Qatar Stars League
    45, // FA Cup
    143, // Copa del Rey
  ],

  /**
   * Live refresh interval. Real-data plans limit daily requests, so real data
   * refreshes every 5 minutes; mock data can refresh every 30 seconds.
   */
  livePollIntervalMs: apiFootballKey ? 5 * 60_000 : 30_000,
};
