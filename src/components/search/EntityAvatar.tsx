import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CircleLogo, type LogoVariant } from '@/components/ui/CircleLogo';
import { Icon } from '@/components/ui/Icon';
import type { SearchEntity } from '@/data/mock/searchCatalog';
import { colors, logoSize } from '@/theme';

const VARIANT: Record<SearchEntity['kind'], LogoVariant> = {
  nationalTeam: 'flag',
  player: 'photo',
  club: 'crest',
  league: 'crest',
};

/**
 * Circular crest / flag / photo for search results, news strips and league rows.
 * Same rules as `TeamLogo` (flags edge-to-edge, crests contained); monogram as fallback.
 */
function EntityAvatarBase({ entity, size = 'xl' }: { entity: SearchEntity; size?: keyof typeof logoSize | number }) {
  const px = typeof size === 'number' ? size : logoSize[size];
  return (
    <CircleLogo
      uri={entity.logo}
      size={px}
      variant={VARIANT[entity.kind]}
      fallbackColor={entity.color}
      fallback={
        <>
          {entity.kind === 'league' && (
            <View style={styles.cornerIcon}>
              <Icon name="trophy" active size={px * 0.22} color="rgba(255,255,255,0.9)" />
            </View>
          )}
          <Text
            style={[styles.initials, { fontSize: px * (entity.initials.length > 3 ? 0.22 : 0.28) }]}
            numberOfLines={1}
          >
            {entity.initials}
          </Text>
          {entity.kind === 'player' && (
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.playerRing, { borderRadius: px / 2 }]} />
          )}
        </>
      }
    />
  );
}

export const EntityAvatar = memo(EntityAvatarBase);

const styles = StyleSheet.create({
  cornerIcon: {
    position: 'absolute',
    top: '14%',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '900',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowRadius: 3,
  },
  playerRing: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
});
