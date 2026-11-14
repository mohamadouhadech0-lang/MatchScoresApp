import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EntityAvatar } from '@/components/search/EntityAvatar';
import { EntitySheet } from '@/components/search/EntitySheet';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { Icon } from '@/components/ui/Icon';
import { findEntity, searchCatalog, trending, type SearchEntity } from '@/data/mock/searchCatalog';
import { ar } from '@/i18n/ar';
import { useSearchHistory, type RecentSearch } from '@/services/search/SearchHistoryProvider';
import { colors, radius, spacing } from '@/theme';

const t = ar.search;

// ───────────── Pieces ─────────────

function SectionTitle({ title, action }: { title: string; action?: { label: string; onPress: () => void } }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action && (
        <HapticPressable onPress={action.onPress} hitSlop={8} accessibilityRole="button">
          <Text style={styles.sectionAction}>{action.label}</Text>
        </HapticPressable>
      )}
    </View>
  );
}

/** Grid of circular avatars with the name underneath (4 per row). */
function AvatarGrid({ items, onPress }: { items: SearchEntity[]; onPress: (e: SearchEntity) => void }) {
  return (
    <View style={styles.grid}>
      {items.map((e) => (
        <HapticPressable
          key={`${e.kind}:${e.id}`}
          onPress={() => onPress(e)}
          style={styles.gridItem}
          accessibilityRole="button"
          accessibilityLabel={e.name}
        >
          <EntityAvatar entity={e} size="xl" />
          <Text style={styles.gridLabel} numberOfLines={2}>
            {e.name}
          </Text>
        </HapticPressable>
      ))}
    </View>
  );
}

function ResultRow({ entity, onPress }: { entity: SearchEntity; onPress: (e: SearchEntity) => void }) {
  return (
    <HapticPressable onPress={() => onPress(entity)} style={styles.resultRow} accessibilityRole="button">
      <EntityAvatar entity={entity} size="lg" />
      <View style={styles.resultTexts}>
        <Text style={styles.resultName} numberOfLines={1}>
          {entity.name}
        </Text>
        <Text style={styles.resultSub} numberOfLines={1}>
          {entity.subtitle}
        </Text>
      </View>
      <Icon name="chevronLeft" size="sm" color={colors.textMuted} />
    </HapticPressable>
  );
}

function RecentRow({
  item,
  onPress,
  onRemove,
}: {
  item: RecentSearch;
  onPress: (item: RecentSearch) => void;
  onRemove: (key: string) => void;
}) {
  const entity = item.type === 'entity' ? findEntity(item.kind, item.id) : undefined;
  return (
    <HapticPressable onPress={() => onPress(item)} style={styles.recentRow} accessibilityRole="button">
      {entity ? (
        <EntityAvatar entity={entity} size="md" />
      ) : (
        <View style={styles.recentIcon}>
          <Icon name="time" size="sm" color={colors.textSecondary} />
        </View>
      )}
      <Text style={styles.recentLabel} numberOfLines={1}>
        {item.label}
      </Text>
      <HapticPressable
        onPress={() => onRemove(item.key)}
        hitSlop={10}
        style={styles.recentRemove}
        accessibilityRole="button"
        accessibilityLabel={t.removeRecent(item.label)}
      >
        <Icon name="close" size={16} color={colors.textSecondary} />
      </HapticPressable>
    </HapticPressable>
  );
}

// ───────────── Screen ─────────────

type ResultSection = { title: string; data: SearchEntity[] };

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<SearchEntity | null>(null);
  const history = useSearchHistory();

  const results = useMemo(() => searchCatalog(query), [query]);
  const sections: ResultSection[] = [
    { title: t.results.clubs, data: results.clubs },
    { title: t.results.nationalTeams, data: results.nationalTeams },
    { title: t.results.leagues, data: results.leagues },
    { title: t.results.players, data: results.players },
  ].filter((s) => s.data.length > 0);

  const openEntity = (e: SearchEntity) => {
    history.add({ type: 'entity', kind: e.kind, id: e.id, label: e.name });
    setSelected(e);
  };

  const openRecent = (item: RecentSearch) => {
    if (item.type === 'text') {
      setQuery(item.label);
      history.add({ type: 'text', label: item.label });
      return;
    }
    const e = findEntity(item.kind, item.id);
    if (e) openEntity(e);
  };

  const showMatches = (q: string) => {
    setSelected(null);
    router.dismissTo({ pathname: '/', params: { q } });
  };

  const typing = query.trim().length > 0;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* Search bar: back (right, RTL) · input · clear */}
      <View style={styles.bar}>
        <HapticPressable
          onPress={() => router.back()}
          hitSlop={8}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel={t.back}
        >
          <Icon name="chevronRight" />
        </HapticPressable>
        <View style={styles.inputWrap}>
          <Icon name="search" size="sm" color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t.placeholder}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoFocus
            autoCorrect={false}
            returnKeyType="search"
            selectionColor={colors.primary}
            onSubmitEditing={() => history.add({ type: 'text', label: query })}
          />
          {typing && (
            <HapticPressable
              onPress={() => setQuery('')}
              hitSlop={10}
              style={styles.clear}
              accessibilityRole="button"
              accessibilityLabel={t.clear}
            >
              <Icon name="close" size={14} color={colors.background} />
            </HapticPressable>
          )}
        </View>
      </View>

      {typing ? (
        <FlatList
          data={sections}
          keyExtractor={(s) => s.title}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.content}
          renderItem={({ item: section }) => (
            <View style={styles.section}>
              <SectionTitle title={section.title} />
              <View style={styles.card}>
                {section.data.map((e, i) => (
                  <View key={`${e.kind}:${e.id}`}>
                    {i > 0 && <View style={styles.divider} />}
                    <ResultRow entity={e} onPress={openEntity} />
                  </View>
                ))}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="search" size={44} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>{t.noResults(query.trim())}</Text>
              <Text style={styles.emptyHint}>{t.noResultsHint}</Text>
            </View>
          }
        />
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <SectionTitle title={t.trendingClubs} />
            <AvatarGrid items={trending.clubs} onPress={openEntity} />
          </View>

          <View style={styles.section}>
            <SectionTitle title={t.trendingLeagues} />
            <AvatarGrid items={trending.leagues} onPress={openEntity} />
          </View>

          <View style={styles.section}>
            <SectionTitle title={t.trendingPlayers} />
            <AvatarGrid items={trending.players} onPress={openEntity} />
          </View>

          <View style={styles.section}>
            <SectionTitle
              title={t.recent}
              action={history.recent.length ? { label: t.clearAll, onPress: history.clear } : undefined}
            />
            {history.recent.length ? (
              <View style={styles.card}>
                {history.recent.map((item, i) => (
                  <View key={item.key}>
                    {i > 0 && <View style={styles.divider} />}
                    <RecentRow item={item} onPress={openRecent} onRemove={history.remove} />
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noRecent}>{t.noRecent}</Text>
            )}
          </View>
        </ScrollView>
      )}

      <EntitySheet entity={selected} onClose={() => setSelected(null)} onShowMatches={showMatches} />
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
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: 0,
    writingDirection: 'rtl',
  },
  clear: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
    flexGrow: 1,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionAction: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.lg,
  },
  gridItem: {
    width: '25%',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: 2,
  },
  gridLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  card: {
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginStart: 64,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  resultTexts: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 2,
  },
  resultName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  resultSub: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    minHeight: 52,
  },
  recentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  recentRemove: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noRecent: {
    alignSelf: 'flex-start',
    color: colors.textMuted,
    fontSize: 13,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: 80,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyHint: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
