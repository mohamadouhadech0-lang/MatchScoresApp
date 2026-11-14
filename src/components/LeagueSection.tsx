import { router } from 'expo-router';
import { memo, useRef, useState, type ComponentRef } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { ar } from '@/i18n/ar';
import type { TimeFormat } from '@/services/settings/SettingsProvider';
import { colors, radius, spacing } from '@/theme';
import type { LeagueMatches, Match } from '@/types/football';
import { MatchCard } from './MatchCard';
import { ContextMenu, type MenuAnchor } from './ui/ContextMenu';
import { HapticPressable } from './ui/HapticPressable';
import { Icon } from './ui/Icon';

interface Props extends LeagueMatches {
  timeFormat: TimeFormat;
  favorites: number[];
  onMatchPress: (match: Match) => void;
}

function LeagueSectionBase({ league, matches, timeFormat, favorites, onMatchPress }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchor | null>(null);
  const dotsRef = useRef<ComponentRef<typeof View>>(null);

  const openMenu = () => {
    dotsRef.current?.measureInWindow((x, y, width, height) => setMenuAnchor({ x, y, width, height }));
  };

  return (
    <View style={styles.section}>
      <HapticPressable
        style={styles.header}
        pressedOpacity={0.85}
        onPress={() => setCollapsed((c) => !c)}
        accessibilityRole="button"
        accessibilityState={{ expanded: !collapsed }}
      >
        <View style={styles.leagueInfo}>
          <View style={styles.leagueLogo}>
            {league.logo ? (
              <Image source={{ uri: league.logo }} style={styles.leagueImage} resizeMode="contain" />
            ) : (
              <Icon name="trophy" active size={15} />
            )}
          </View>
          <Text style={styles.leagueName} numberOfLines={1}>
            {league.name}
          </Text>
        </View>
        <View ref={dotsRef} collapsable={false}>
          <HapticPressable
            onPress={openMenu}
            hitSlop={10}
            style={[styles.dots, menuAnchor && styles.dotsActive]}
            accessibilityRole="button"
            accessibilityLabel={ar.a11y.leagueOptions}
            accessibilityState={{ expanded: !!menuAnchor }}
          >
            <Icon name="dots" color={menuAnchor ? colors.primary : colors.textSecondary} />
          </HapticPressable>
        </View>
      </HapticPressable>

      {!collapsed && (
        <View style={styles.matches}>
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} timeFormat={timeFormat} favorites={favorites} onPress={onMatchPress} />
          ))}
        </View>
      )}

      <ContextMenu
        anchor={menuAnchor}
        onClose={() => setMenuAnchor(null)}
        items={[
          collapsed
            ? { key: 'toggle', label: ar.sheets.league.expand, icon: 'matches', onPress: () => setCollapsed(false) }
            : { key: 'toggle', label: ar.sheets.league.collapse, icon: 'close', onPress: () => setCollapsed(true) },
          {
            key: 'standings',
            label: ar.sheets.league.standings,
            icon: 'standings',
            onPress: () => router.navigate('/standings'),
          },
        ]}
      />
    </View>
  );
}

export const LeagueSection = memo(LeagueSectionBase);

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
  },
  leagueInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  leagueLogo: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.capsule,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leagueImage: {
    width: 18,
    height: 18,
  },
  leagueName: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    writingDirection: 'rtl',
  },
  dots: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotsActive: {
    backgroundColor: colors.primarySoft,
  },
  matches: {
    gap: spacing.sm,
  },
});
