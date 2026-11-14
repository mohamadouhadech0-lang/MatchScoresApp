import type { League, LeagueStandings, StandingRow, Team } from '@/types/football';
import { leagues, teams as T } from './teams';

type Form = StandingRow['form'];
type RawRow = [team: Team, won: number, drawn: number, lost: number, gf: number, ga: number, form: string];

function zoneFor(rank: number, total: number): StandingRow['zone'] {
  if (rank <= 3) return 'champions';
  if (rank === 4) return 'europa';
  if (rank === total) return 'relegation';
  return undefined;
}

/** Computes points/played/ranks from raw records so the mock table is always consistent. */
function table(league: League, raw: RawRow[]): LeagueStandings {
  const rows = raw
    .map(([team, won, drawn, lost, goalsFor, goalsAgainst, form]) => ({
      team,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      played: won + drawn + lost,
      points: won * 3 + drawn,
      form: form.split('') as Form,
    }))
    .sort(
      (a, b) =>
        b.points - a.points || b.goalsFor - b.goalsAgainst - (a.goalsFor - a.goalsAgainst) || b.goalsFor - a.goalsFor,
    )
    .map((row, i, all): StandingRow => ({ ...row, rank: i + 1, zone: zoneFor(i + 1, all.length) }));

  return { league, rows };
}

export const mockStandings: LeagueStandings[] = [
  table(leagues.saudi, [
    [T.hilal, 8, 2, 0, 24, 7, 'WWDWW'],
    [T.ittihad, 7, 2, 1, 21, 10, 'WDWWL'],
    [T.nassr, 7, 1, 2, 23, 11, 'WWLWW'],
    [T.ahli, 6, 2, 2, 17, 10, 'DWWLW'],
    [T.qadsiah, 5, 3, 2, 14, 9, 'DDWWD'],
    [T.ettifaq, 3, 3, 4, 11, 14, 'LDWLD'],
    [T.shabab, 2, 4, 4, 9, 13, 'DLDDL'],
    [T.taawoun, 1, 2, 7, 7, 22, 'LLDLL'],
  ]),
  table(leagues.premier, [
    [T.liverpool, 8, 2, 1, 25, 9, 'WWWDW'],
    [T.arsenal, 8, 1, 2, 22, 8, 'WLWWW'],
    [T.mancity, 7, 2, 2, 24, 12, 'WDWLW'],
    [T.chelsea, 6, 3, 2, 20, 13, 'DWWDL'],
    [T.villa, 5, 3, 3, 16, 14, 'WLDWW'],
    [T.newcastle, 5, 2, 4, 15, 13, 'LWWLD'],
    [T.tottenham, 4, 2, 5, 18, 18, 'LWLDW'],
    [T.manutd, 3, 3, 5, 12, 16, 'DLLWD'],
  ]),
  table(leagues.laliga, [
    [T.realmadrid, 9, 2, 1, 28, 10, 'WWWWD'],
    [T.barcelona, 9, 1, 2, 33, 14, 'WLWWW'],
    [T.atletico, 7, 4, 1, 20, 8, 'DWDWW'],
    [T.villarreal, 6, 3, 3, 21, 17, 'WDLWW'],
    [T.bilbao, 5, 5, 2, 17, 12, 'DWDDD'],
    [T.betis, 5, 3, 4, 15, 14, 'LWDWL'],
    [T.sociedad, 3, 4, 5, 12, 15, 'DLLWD'],
    [T.sevilla, 2, 3, 7, 10, 22, 'LLDLL'],
  ]),
];
