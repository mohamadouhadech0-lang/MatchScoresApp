import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EntityAvatar } from '@/components/search/EntityAvatar';
import { LeagueRow, STAR_YELLOW } from '@/components/leagues/LeagueRow';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { Icon } from '@/components/ui/Icon';
import { config } from '@/config';
import { leagueEntities, normalize, type SearchEntity } from '@/data/mock/searchCatalog';
import { useLeagues } from '@/hooks/useStandings';
import { ar } from '@/i18n/ar';
import { sortByOrder, useSettings } from '@/services/settings/SettingsProvider';
import { colors, radius, spacing } from '@/theme';

const t = ar.leagues;
const catalogById = new Map(leagueEntities.map((l) => [l.id, l]));
const EMPTY: number[] = [];

/**
 * Mock mode: the demo catalog. Real mode: the configured featured leagues, with Arabic names
 * from the catalog where available and logos/names from API-Football `/leagues`.
 */
function useLeagueEntities(): SearchEntity[] {
  const apiLeagues = useLeagues(config.usingRealData ? config.featuredLeagueIds : EMPTY);
  return useMemo(() => {
    if (!config.usingRealData || !apiLeagues) return leagueEntities;
    return apiLeagues.map((l) => {
      const known = catalogById.get(l.id);
      return known
        ? { ...known, logo: l.logo }
        : {
            kind: 'league' as const,
            id: l.id,
            name: l.name,
            subtitle: l.country,
            initials: l.name.slice(0, 3).toUpperCase(),
            color: colors.surfaceElevated,
            logo: l.logo,
          };
    });
  }, [apiLeagues]);
}

type Mode = 'all' | 'favorites' | 'hidden';

export default function LeaguesScreen() {
  const settings = useSettings();
  const entities = useLeagueEntities();
  const ALL_IDS = useMemo(() => entities.map((l) => l.id), [entities]);
  const byId = useMemo(() => new Map(entities.map((l) => [l.id, l])), [entities]);
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<Mode>('all');
  const [orderOpen, setOrderOpen] = useState(false);

  const ordered = useMemo(() => {
    const ids = sortByOrder(ALL_IDS, settings.leagueOrder);
    // Favorites first, keeping the custom order inside each group.
    const fav = ids.filter((id) => settings.favoriteLeagues.includes(id));
    const rest = ids.filter((id) => !settings.favoriteLeagues.includes(id));
    return [...fav, ...rest].map((id) => byId.get(id)!);
  }, [ALL_IDS, byId, settings.leagueOrder, settings.favoriteLeagues]);

  const visible = useMemo(() => {
    const q = normalize(query);
    return ordered.filter((l) => {
      if (mode === 'favorites' && !settings.favoriteLeagues.includes(l.id)) return false;
      if (mode === 'hidden' && !settings.hiddenLeagues.includes(l.id)) return false;
      return !q || [l.name, l.subtitle, ...(l.aliases ?? [])].some((s) => normalize(s).includes(q));
    });
  }, [ordered, query, mode, settings.favoriteLeagues, settings.hiddenLeagues]);

  const toggleMode = (m: Mode) => setMode((cur) => (cur === m ? 'all' : m));

  const emptyText = query
    ? t.noResults
    : mode === 'favorites'
      ? t.noFavorites
      : mode === 'hidden'
        ? t.noHidden
        : t.noResults;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Text style={styles.title}>{t.title}</Text>

      <View style={styles.searchBox}>
        <Icon name="search" size="sm" color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t.search}
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          returnKeyType="search"
          selectionColor={colors.primary}
        />
        {query ? (
          <HapticPressable
            onPress={() => setQuery('')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={ar.search.clear}
          >
            <Icon name="close" size="sm" color={colors.textSecondary} />
          </HapticPressable>
        ) : null}
      </View>

      <View style={styles.quick}>
        <HapticPressable
          onPress={() => toggleMode('favorites')}
          style={[styles.quickButton, mode === 'favorites' && styles.quickActive]}
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'favorites' }}
        >
          <Icon name="star" active color={STAR_YELLOW} size="sm" />
          <Text style={[styles.quickText, mode === 'favorites' && styles.quickTextActive]}>{t.favorites}</Text>
          <View style={styles.counter}>
            <Text style={styles.counterText}>{settings.favoriteLeagues.length}</Text>
          </View>
        </HapticPressable>
        <HapticPressable
          onPress={() => toggleMode('hidden')}
          style={[styles.quickButton, mode === 'hidden' && styles.quickActive]}
          accessibilityRole="button"
          accessibilityState={{ selected: mode === 'hidden' }}
        >
          <Icon
            name="hide"
            active={mode === 'hidden'}
            size="sm"
            color={mode === 'hidden' ? colors.primary : colors.text}
          />
          <Text style={[styles.quickText, mode === 'hidden' && styles.quickTextActive]}>{t.hidden}</Text>
          {settings.hiddenLeagues.length > 0 && (
            <View style={styles.counter}>
              <Text style={styles.counterText}>{settings.hiddenLeagues.length}</Text>
            </View>
          )}
        </HapticPressable>
      </View>

      <FlatList
        data={visible}
        keyExtractor={(l) => String(l.id)}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        renderItem={({ item }) => (
          <LeagueRow
            league={item}
            favorite={settings.favoriteLeagues.includes(item.id)}
            hidden={settings.hiddenLeagues.includes(item.id)}
            onPress={() => router.push({ pathname: '/league/[id]', params: { id: String(item.id) } })}
            onToggleFavorite={() => settings.toggleIn('favoriteLeagues', item.id)}
            onToggleHidden={() => settings.toggleIn('hiddenLeagues', item.id)}
            onCustomizeOrder={() => setOrderOpen(true)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="trophy" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>{emptyText}</Text>
          </View>
        }
      />

      <BottomSheet
        visible={orderOpen}
        onClose={() => setOrderOpen(false)}
        title={t.orderTitle}
        subtitle={t.orderSubtitle}
      >
        {sortByOrder(ALL_IDS, settings.leagueOrder).map((id, i, all) => {
          const l = byId.get(id)!;
          return (
            <View key={id} style={styles.orderRow}>
              <Text style={styles.orderIndex}>{i + 1}</Text>
              <EntityAvatar entity={l} size="md" />
              <Text style={styles.orderName} numberOfLines={1}>
                {l.name}
              </Text>
              <HapticPressable
                onPress={() => settings.moveLeague(ALL_IDS, id, -1)}
                disabled={i === 0}
                hitSlop={6}
                style={styles.orderButton}
                accessibilityRole="button"
                accessibilityLabel={`${t.moveUp}: ${l.name}`}
              >
                <Icon name="arrowUp" size="sm" />
              </HapticPressable>
              <HapticPressable
                onPress={() => settings.moveLeague(ALL_IDS, id, 1)}
                disabled={i === all.length - 1}
                hitSlop={6}
                style={styles.orderButton}
                accessibilityRole="button"
                accessibilityLabel={`${t.moveDown}: ${l.name}`}
              >
                <Icon name="arrowDown" size="sm" />
              </HapticPressable>
            </View>
          );
        })}
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    direction: 'rtl',
    backgroundColor: colors.background,
  },
  title: {
    alignSelf: 'flex-start',
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: 0,
    writingDirection: 'rtl',
  },
  quick: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  quickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  quickActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  quickText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  quickTextActive: {
    color: colors.primary,
  },
  counter: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: colors.capsule,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  list: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: 80,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 54,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
  },
  orderIndex: {
    width: 18,
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  orderName: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  orderButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
