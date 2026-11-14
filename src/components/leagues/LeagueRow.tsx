import { useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { EntityAvatar } from '@/components/search/EntityAvatar';
import { ContextMenu, type MenuAnchor } from '@/components/ui/ContextMenu';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { Icon } from '@/components/ui/Icon';
import type { SearchEntity } from '@/data/mock/searchCatalog';
import { ar } from '@/i18n/ar';
import { colors, radius, spacing } from '@/theme';

const t = ar.leagues;
export const STAR_YELLOW = '#FACC15';

interface Props {
  league: SearchEntity;
  favorite: boolean;
  hidden: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
  onToggleHidden: () => void;
  onCustomizeOrder: () => void;
}

/** League card: crest · name · quick star · "..." dropdown. */
export function LeagueRow({
  league,
  favorite,
  hidden,
  onPress,
  onToggleFavorite,
  onToggleHidden,
  onCustomizeOrder,
}: Props) {
  const [anchor, setAnchor] = useState<MenuAnchor | null>(null);
  const dotsRef = useRef<ComponentRef<typeof View>>(null);

  return (
    <HapticPressable
      onPress={onPress}
      pressedOpacity={0.85}
      style={[styles.card, hidden && styles.cardHidden]}
      accessibilityRole="button"
    >
      <EntityAvatar entity={league} size="lg" />
      <View style={styles.texts}>
        <Text style={styles.name} numberOfLines={1}>
          {league.name}
        </Text>
        <View style={styles.subRow}>
          <Text style={styles.sub}>{league.subtitle}</Text>
          {hidden && (
            <View style={styles.hiddenBadge}>
              <Icon name="hide" size={11} color={colors.textSecondary} />
              <Text style={styles.hiddenText}>{t.hiddenBadge}</Text>
            </View>
          )}
        </View>
      </View>

      <HapticPressable
        feedback="impact"
        onPress={onToggleFavorite}
        hitSlop={8}
        style={styles.iconButton}
        accessibilityRole="button"
        accessibilityLabel={favorite ? t.removeFavorite : t.addFavorite}
        accessibilityState={{ selected: favorite }}
      >
        <Icon name="star" active={favorite} color={favorite ? STAR_YELLOW : colors.textMuted} />
      </HapticPressable>

      <View ref={dotsRef} collapsable={false}>
        <HapticPressable
          onPress={() => dotsRef.current?.measureInWindow((x, y, width, height) => setAnchor({ x, y, width, height }))}
          hitSlop={8}
          style={[styles.iconButton, anchor && styles.iconButtonActive]}
          accessibilityRole="button"
          accessibilityLabel={ar.a11y.leagueOptions}
        >
          <Icon name="dots" color={anchor ? colors.primary : colors.textSecondary} />
        </HapticPressable>
      </View>

      <ContextMenu
        anchor={anchor}
        onClose={() => setAnchor(null)}
        items={[
          { key: 'order', label: t.customizeOrder, icon: 'reorder', onPress: onCustomizeOrder },
          hidden
            ? { key: 'hide', label: t.showMatches, icon: 'show', onPress: onToggleHidden }
            : { key: 'hide', label: t.hideMatches, icon: 'hide', onPress: onToggleHidden, destructive: true },
        ]}
      />
    </HapticPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingStart: spacing.md,
    paddingEnd: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  cardHidden: {
    opacity: 0.6,
  },
  texts: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 2,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sub: {
    color: colors.textMuted,
    fontSize: 12,
  },
  hiddenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceElevated,
  },
  hiddenText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonActive: {
    backgroundColor: colors.primarySoft,
  },
});
