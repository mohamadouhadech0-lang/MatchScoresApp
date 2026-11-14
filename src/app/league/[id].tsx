import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScorersList, SectionTitle } from '@/components/match/MatchSections';
import { EntityAvatar } from '@/components/search/EntityAvatar';
import { RealStandings } from '@/components/RealStandings';
import { StandingsTable } from '@/components/StandingsTable';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { Icon } from '@/components/ui/Icon';
import { STAR_YELLOW } from '@/components/leagues/LeagueRow';
import { config } from '@/config';
import { getGroupTable, getTopScorers } from '@/data/mock/matchExtras';
import { getNationsLeagueMatches } from '@/data/mock/nationsLeague';
import { leagueEntities } from '@/data/mock/searchCatalog';
import { mockStandings } from '@/data/mock/standings';
import { useLeagues } from '@/hooks/useStandings';
import { ar } from '@/i18n/ar';
import { useSettings } from '@/services/settings/SettingsProvider';
import { colors, radius, spacing } from '@/theme';
import type { StandingRow } from '@/types/football';

const t = ar.leagues;
const NATIONS_LEAGUE_ID = 5;

function standingsFor(leagueId: number): StandingRow[] | null {
  if (leagueId === NATIONS_LEAGUE_ID) {
    // Group of the first featured fixture (14/11/2026).
    const [first] = getNationsLeagueMatches(new Date(2026, 10, 14));
    return first ? getGroupTable(first) : null;
  }
  return mockStandings.find((s) => s.league.id === leagueId)?.rows ?? null;
}

export default function LeagueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const leagueId = Number(id);
  const catalogLeague = leagueEntities.find((l) => l.id === leagueId);
  const settings = useSettings();
  // Real data: league meta (logo + current season) from /leagues, table from /standings.
  const apiLeagues = useLeagues(config.usingRealData ? [leagueId] : []);
  const apiLeague = apiLeagues?.[0];
  const league = catalogLeague
    ? { ...catalogLeague, logo: apiLeague?.logo ?? catalogLeague.logo }
    : apiLeague
      ? {
          kind: 'league' as const,
          id: apiLeague.id,
          name: apiLeague.name,
          subtitle: apiLeague.country,
          initials: apiLeague.name.slice(0, 3).toUpperCase(),
          color: colors.surfaceElevated,
          logo: apiLeague.logo,
        }
      : undefined;
  const rows = useMemo(() => (config.usingRealData ? null : standingsFor(leagueId)), [leagueId]);
  const scorers = useMemo(
    () =>
      !config.usingRealData && (leagueId === NATIONS_LEAGUE_ID || mockStandings.some((s) => s.league.id === leagueId))
        ? getTopScorers(leagueId)
        : null,
    [leagueId],
  );
  const favorite = settings.favoriteLeagues.includes(leagueId);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/standings'));

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.bar}>
        <HapticPressable
          onPress={goBack}
          hitSlop={6}
          style={styles.barButton}
          accessibilityRole="button"
          accessibilityLabel={ar.search.back}
        >
          <Icon name="chevronRight" />
        </HapticPressable>
        <Text style={styles.barTitle} numberOfLines={1}>
          {league?.name ?? ''}
        </Text>
        <HapticPressable
          feedback="impact"
          onPress={() => settings.toggleIn('favoriteLeagues', leagueId)}
          hitSlop={6}
          style={styles.barButton}
          accessibilityRole="button"
          accessibilityLabel={favorite ? t.removeFavorite : t.addFavorite}
        >
          <Icon name="star" active={favorite} color={favorite ? STAR_YELLOW : colors.text} />
        </HapticPressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {league && (
          <View style={styles.hero}>
            <EntityAvatar entity={league} size="hero" />
            <Text style={styles.name}>{league.name}</Text>
            <Text style={styles.sub}>{league.subtitle}</Text>
          </View>
        )}

        {config.usingRealData ? (
          <View style={styles.section}>
            <SectionTitle title={ar.tabs.standings} />
            {apiLeague ? (
              <RealStandings league={apiLeague} />
            ) : (
              <Text style={styles.emptyText}>{apiLeagues ? ar.realData.standingsUnavailable : ''}</Text>
            )}
          </View>
        ) : rows ? (
          <View style={styles.section}>
            <SectionTitle title={ar.tabs.standings} />
            <StandingsTable rows={rows} />
          </View>
        ) : (
          <View style={styles.empty}>
            <Icon name="standings" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>{t.standingsUnavailable}</Text>
          </View>
        )}

        {scorers && <ScorersList scorers={scorers} />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    direction: 'rtl',
    backgroundColor: colors.background,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  barButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  content: {
    padding: spacing.lg,
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  name: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  sub: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  section: {
    gap: spacing.md,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
});
