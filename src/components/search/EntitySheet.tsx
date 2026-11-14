import { StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { Icon } from '@/components/ui/Icon';
import type { SearchEntity } from '@/data/mock/searchCatalog';
import { ar } from '@/i18n/ar';
import { useSettings } from '@/services/settings/SettingsProvider';
import { colors, radius, spacing } from '@/theme';
import { EntityAvatar } from './EntityAvatar';

interface Props {
  entity: SearchEntity | null;
  onClose: () => void;
  /** Opens the matches tab filtered by this text. */
  onShowMatches: (query: string) => void;
}

/** Quick profile for a search result: favorite toggle (teams) + jump to matches. */
export function EntitySheet({ entity, onClose, onShowMatches }: Props) {
  const { favorites, toggleFavorite } = useSettings();
  const isTeam = entity?.kind === 'club' || entity?.kind === 'nationalTeam';
  const fav = !!entity && favorites.includes(entity.id);

  // Players link to their club's matches; everything else to its own name.
  const matchQuery = entity ? (entity.kind === 'player' ? entity.subtitle : entity.name) : '';
  const matchLabel = entity?.kind === 'player' ? ar.search.showTeamMatches(entity.subtitle) : ar.search.showMatches;

  return (
    <BottomSheet
      visible={!!entity}
      onClose={onClose}
      title={entity?.name ?? ''}
      subtitle={entity ? ar.search.kinds[entity.kind] : undefined}
    >
      {entity && (
        <>
          <View style={styles.hero}>
            <EntityAvatar entity={entity} size="display" />
            <Text style={styles.name}>{entity.name}</Text>
            <Text style={styles.subtitle}>{entity.subtitle}</Text>
          </View>

          <View style={styles.actions}>
            {isTeam && (
              <HapticPressable
                feedback="impact"
                onPress={() => toggleFavorite(entity.id)}
                style={[styles.button, styles.secondary, fav && styles.secondaryActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: fav }}
              >
                <Icon name="star" active={fav} size="sm" color={fav ? colors.primary : colors.text} />
                <Text style={[styles.buttonText, fav && { color: colors.primary }]}>
                  {fav ? ar.sheets.match.removeFavorite : ar.sheets.match.addFavorite}
                </Text>
              </HapticPressable>
            )}
            <HapticPressable
              feedback="impact"
              onPress={() => onShowMatches(matchQuery)}
              style={[styles.button, styles.primary]}
              accessibilityRole="button"
            >
              <Icon name="matches" active size="sm" color={colors.background} />
              <Text style={[styles.buttonText, styles.primaryText]} numberOfLines={1}>
                {matchLabel}
              </Text>
            </HapticPressable>
          </View>
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  name: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  actions: {
    gap: spacing.sm,
  },
  button: {
    height: 50,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  secondaryActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  buttonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  primaryText: {
    color: colors.background,
    fontWeight: '800',
  },
});
