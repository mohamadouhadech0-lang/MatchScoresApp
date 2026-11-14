import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NewsCard, NewsRow } from '@/components/news/NewsCard';
import { NewsSheet } from '@/components/news/NewsSheet';
import { EntityAvatar } from '@/components/search/EntityAvatar';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { Icon } from '@/components/ui/Icon';
import { OptionList, ToggleRow } from '@/components/ui/OptionList';
import { RtlHorizontalScroll } from '@/components/ui/RtlHorizontalScroll';
import { mockNews, newsCategories, newsTeams, type NewsCategory, type NewsItem } from '@/data/mock/news';
import { ar } from '@/i18n/ar';
import { colors, radius, spacing } from '@/theme';

const t = ar.newsPage;
const CATEGORIES = Object.keys(newsCategories) as NewsCategory[];

type Layout = 'cards' | 'compact';

export default function NewsScreen() {
  const [category, setCategory] = useState<NewsCategory | 'all'>('all');
  const [team, setTeam] = useState<string | null>(null);
  const [layout, setLayout] = useState<Layout>('cards');
  const [enabled, setEnabled] = useState<Record<NewsCategory, boolean>>({
    clubs: true,
    national: true,
    transfers: true,
    analysis: true,
  });
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [openItem, setOpenItem] = useState<NewsItem | null>(null);

  const items = useMemo(
    () =>
      mockNews.filter(
        (n) =>
          enabled[n.category] && (category === 'all' || n.category === category) && (!team || n.tags.includes(team)),
      ),
    [enabled, category, team],
  );
  const featured = layout === 'cards' ? items.filter((n) => n.featured) : [];
  const rest = items.filter((n) => !featured.includes(n));
  const visibleCategories = CATEGORIES.filter((c) => enabled[c]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{t.title}</Text>
        <View style={styles.demoPill}>
          <Text style={styles.demoText}>{t.demo}</Text>
        </View>
        <View style={styles.flex} />
        <HapticPressable
          onPress={() => setCustomizeOpen(true)}
          hitSlop={6}
          style={styles.headerButton}
          accessibilityRole="button"
          accessibilityLabel={t.customize}
        >
          <Icon name="options" />
        </HapticPressable>
      </View>

      <RtlHorizontalScroll contentContainerStyle={styles.chips}>
        {(['all', ...visibleCategories] as const).map((c) => {
          const active = c === category;
          return (
            <HapticPressable
              key={c}
              onPress={() => setCategory(c)}
              style={[styles.chip, active && styles.chipActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {c === 'all' ? t.all : newsCategories[c]}
              </Text>
            </HapticPressable>
          );
        })}
      </RtlHorizontalScroll>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {featured.map((n) => (
          <NewsCard key={n.id} item={n} onPress={setOpenItem} />
        ))}

        {rest.length > 0 && <Text style={styles.sectionTitle}>{t.latest}</Text>}
        {rest.map((n) =>
          layout === 'cards' ? (
            <NewsCard key={n.id} item={n} onPress={setOpenItem} />
          ) : (
            <NewsRow key={n.id} item={n} onPress={setOpenItem} />
          ),
        )}

        {items.length === 0 && (
          <View style={styles.empty}>
            <Icon name="news" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>{t.empty}</Text>
          </View>
        )}

        {/* Quick strip of clubs & national teams */}
        <View style={styles.teamsSection}>
          <Text style={styles.sectionTitle}>{t.teams}</Text>
          <RtlHorizontalScroll contentContainerStyle={styles.teams}>
            {newsTeams.map((e) => {
              const active = team === e.name;
              return (
                <HapticPressable
                  key={`${e.kind}:${e.id}`}
                  onPress={() => setTeam(active ? null : e.name)}
                  style={styles.teamItem}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={e.name}
                >
                  <View style={[styles.teamRing, active && styles.teamRingActive]}>
                    <EntityAvatar entity={e} size="xl" />
                  </View>
                  <Text style={[styles.teamName, active && styles.teamNameActive]} numberOfLines={1}>
                    {e.name}
                  </Text>
                </HapticPressable>
              );
            })}
          </RtlHorizontalScroll>
        </View>
      </ScrollView>

      <BottomSheet visible={customizeOpen} onClose={() => setCustomizeOpen(false)} title={t.customize}>
        <Text style={styles.sheetLabel}>{t.layout}</Text>
        <OptionList<Layout>
          options={[
            { value: 'cards', label: t.layoutCards, icon: 'widgets' },
            { value: 'compact', label: t.layoutCompact, icon: 'reorder' },
          ]}
          selected={layout}
          onSelect={setLayout}
        />
        <Text style={styles.sheetLabel}>{t.categories}</Text>
        {CATEGORIES.map((c) => (
          <ToggleRow
            key={c}
            label={newsCategories[c]}
            icon="news"
            value={enabled[c]}
            onValueChange={(v) => {
              setEnabled((e) => ({ ...e, [c]: v }));
              if (!v && category === c) setCategory('all');
            }}
          />
        ))}
      </BottomSheet>

      <NewsSheet item={openItem} onClose={() => setOpenItem(null)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    direction: 'rtl',
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  demoPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  demoText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.primary,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextActive: {
    color: colors.background,
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  sectionTitle: {
    alignSelf: 'flex-start',
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: spacing.sm,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  teamsSection: {
    gap: spacing.md,
    marginTop: spacing.md,
    marginHorizontal: -spacing.lg,
  },
  teams: {
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  teamItem: {
    width: 66,
    alignItems: 'center',
    gap: 6,
  },
  teamRing: {
    padding: 2,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  teamRingActive: {
    borderColor: colors.primary,
  },
  teamName: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  teamNameActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  sheetLabel: {
    alignSelf: 'flex-start',
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
});
