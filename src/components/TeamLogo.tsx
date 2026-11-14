import { memo } from 'react';
import { StyleSheet, Text } from 'react-native';

import { colors, logoSize } from '@/theme';
import type { Team } from '@/types/football';
import { CircleLogo } from './ui/CircleLogo';

interface Props {
  team: Team;
  /** Diameter: a `logoSize` token (preferred) or a number. */
  size?: keyof typeof logoSize | number;
}

const isFlag = (team: Team) => !!team.national || !!team.logo?.includes('flagcdn.com');

/** Circular team flag (edge-to-edge) or crest (contained). Colored monogram as fallback. */
function TeamLogoBase({ team, size = 'md' }: Props) {
  const px = typeof size === 'number' ? size : logoSize[size];
  return (
    <CircleLogo
      uri={team.logo}
      size={px}
      variant={isFlag(team) ? 'flag' : 'crest'}
      fallbackColor={team.color}
      fallback={
        <Text style={[styles.initials, { fontSize: px * 0.32 }]} numberOfLines={1}>
          {team.shortName}
        </Text>
      }
    />
  );
}

export const TeamLogo = memo(TeamLogoBase);

const styles = StyleSheet.create({
  initials: {
    color: colors.text,
    fontWeight: '800',
  },
});
