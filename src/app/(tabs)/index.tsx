import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/AppHeader';
import { DataErrorView, StaleDataBanner } from '@/components/DataErrorView';
import { LeagueSection } from '@/components/LeagueSection';
import { DateSheet, FilterSheet, type MatchFilter } from '@/components/sheets/MatchesSheets';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { Icon } from '@/components/ui/Icon';
import { normalize } from '@/data/mock/searchCatalog';
import { useMatchesByDate } from '@/hooks/useMatchesByDate';
import { ar } from '@/i18n/ar';
import { useSettings, type MatchSort } from '@/services/settings/SettingsProvider';
import { colors, radius, spacing } from '@/theme';
import type { Match } from '@/types/football';
import { addDays, formatDayTitle, isSameDay } from '@/utils/format';

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

const statusRank: Record<Match['status'], number> = { live: 0, scheduled: 1, finished: 2 };

function sortMatches(matches: Match[], sortBy: MatchSort): Match[] {
  if (sortBy === 'league') return matches;
  return [...matches].sort((a, b) => {
    if (sortBy === 'live-first') {
      const d = statusRank[a.status] - statusRank[b.status];
      if (d !== 0) return d;
    }
    return a.kickoff.localeCompare(b.kickoff) || a.id - b.id;
  });
}

const filterLabel: Record<MatchFilter, string> = {
  all: ar.sheets.filter.all,
  live: ar.sheets.filter.live,
  scheduled: ar.sheets.filter.scheduled,
  finished: ar.sheets.filter.finished,
  favorites: ar.sheets.filter.favorites,
};

export default function MatchesScreen() {
  const { timeFormat, sortBy, favorites, hiddenLeagues } = useSettings();
  const [date, setDate] = useState(startOfToday);
  const [filter, setFilter] = useState<MatchFilter>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  // Set by the search screen ("عرض المباريات"); cleared from the chip under the date.
  const { q } = useLocalSearchParams<{ q?: string }>();
  const query = q ?? '';

  const { groups, loading, refreshing, error, stale, refresh, retry } = useMatchesByDate(date);
  const isToday = isSameDay(date, new Date());

  const visibleGroups = useMemo(() => {
    const needle = normalize(query);
    const hit = (text: string) => normalize(text).includes(needle);
    return groups
      .filter((g) => !hiddenLeagues.includes(g.league.id))
      .map((g) => ({
        ...g,
        matches: sortMatches(
          g.matches.filter((m) => {
            if (filter === 'favorites') {
              if (!favorites.includes(m.homeTeam.id) && !favorites.includes(m.awayTeam.id)) return false;
            } else if (filter !== 'all' && m.status !== filter) {
              return false;
            }
            return !needle || hit(m.homeTeam.name) || hit(m.awayTeam.name) || hit(g.league.name);
          }),
          sortBy,
        ),
      }))
      .filter((g) => g.matches.length > 0);
  }, [groups, filter, query, sortBy, favorites, hiddenLeagues]);

  const clearQuery = () => router.setParams({ q: undefined });

  const onMatchPress = useCallback(
    (m: Match) => router.push({ pathname: '/match/[id]', params: { id: String(m.id) } }),
    [],
  );

  const emptyText = groups.length === 0 ? ar.noMatchesForDay : query ? ar.noSearchResults : ar.noMatches;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <AppHeader
        filterActive={filter !== 'all'}
        searchActive={!!query}
        onFilterPress={() => setFilterOpen(true)}
        onSearchPress={() => router.push('/search')}
        onPreviousDay={() => setDate((d) => addDays(d, -1))}
        onNextDay={() => setDate((d) => addDays(d, 1))}
        onCalendarPress={() => setDateOpen(true)}
      />

      <View style={styles.dateRow}>
        <HapticPressable onPress={() => setDateOpen(true)} style={styles.dateTitleButton} accessibilityRole="button">
          <Text style={styles.dateTitle}>{formatDayTitle(date)}</Text>
        </HapticPressable>
        {isToday ? (
          <View style={styles.todayBadge}>
            <Text style={styles.todayText}>{ar.todayBadge}</Text>
          </View>
        ) : (
          <HapticPressable onPress={() => setDate(startOfToday())} style={styles.todayBadge} accessibilityRole="button">
            <Text style={styles.todayText}>{ar.a11y.goToToday}</Text>
          </HapticPressable>
        )}
        {query ? (
          <HapticPressable
            onPress={clearQuery}
            style={styles.filterChip}
            accessibilityRole="button"
            accessibilityLabel={`${ar.search.searchingFor(query)}، ${ar.sheets.close}`}
          >
            <Text style={styles.filterChipText} numberOfLines={1}>
              {ar.search.searchingFor(query)}
            </Text>
            <Icon name="close" size={14} color={colors.background} />
          </HapticPressable>
        ) : null}
        {filter !== 'all' && (
          <HapticPressable
            onPress={() => setFilter('all')}
            style={styles.filterChip}
            accessibilityRole="button"
            accessibilityLabel={`${filterLabel[filter]}، ${ar.sheets.close}`}
          >
            <Text style={styles.filterChipText}>{filterLabel[filter]}</Text>
            <Icon name="close" size={14} color={colors.background} />
          </HapticPressable>
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : error && !stale ? (
        // Nothing to show: explain why (daily quota, rate limit, offline…) and offer a retry.
        <DataErrorView error={error} onRetry={retry} timeFormat={timeFormat} />
      ) : (
        <FlatList
          ListHeaderComponent={error ? <StaleDataBanner error={error} onRetry={refresh} /> : undefined}
          ListHeaderComponentStyle={styles.bannerWrap}
          data={visibleGroups}
          keyExtractor={(g) => String(g.league.id)}
          renderItem={({ item }) => (
            <LeagueSection
              league={item.league}
              matches={item.matches}
              timeFormat={timeFormat}
              favorites={favorites}
              onMatchPress={onMatchPress}
            />
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.sectionGap} />}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.surface}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="matches" size={44} color={colors.textMuted} />
              <Text style={styles.emptyText}>{emptyText}</Text>
            </View>
          }
        />
      )}

      <FilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        value={filter}
        onChange={setFilter}
        onToday={() => setDate(startOfToday())}
      />
      <DateSheet visible={dateOpen} onClose={() => setDateOpen(false)} value={date} onChange={setDate} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    // Force RTL layout so the design is correct even before the native RTL flag takes effect.
    direction: 'rtl',
    backgroundColor: colors.background,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  dateTitleButton: {
    paddingVertical: 2,
  },
  dateTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    writingDirection: 'rtl',
  },
  todayBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  todayText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  filterChipText: {
    color: colors.background,
    fontSize: 11,
    fontWeight: '800',
  },
  bannerWrap: {
    marginHorizontal: -spacing.lg,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  sectionGap: {
    height: spacing.lg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingTop: 80,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
