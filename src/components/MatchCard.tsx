import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ar } from '@/i18n/ar';
import type { TimeFormat } from '@/services/settings/SettingsProvider';
import { colors, radius, spacing } from '@/theme';
import type { Match } from '@/types/football';
import { formatKickoff } from '@/utils/format';
import { ClockRing } from './match/LiveScoreboard';
import { TeamLogo } from './TeamLogo';
import { HapticPressable } from './ui/HapticPressable';
import { Icon } from './ui/Icon';

export function matchStatusText(match: Match): string {
  if (match.status === 'finished') return ar.filters.finished;
  if (match.status === 'scheduled') return ar.filters.scheduled;
  if (match.phase === 'half_time') return ar.phase.half_time;
  return `${match.minute ?? ''}'`;
}

export function MatchCenter({ match, timeFormat, large }: { match: Match; timeFormat: TimeFormat; large?: boolean }) {
  if (match.status === 'scheduled') {
    return (
      <View style={[styles.capsule, large && styles.capsuleLarge]}>
        <Text style={[styles.time, large && styles.timeLarge]}>{formatKickoff(match.kickoff, timeFormat)}</Text>
      </View>
    );
  }

  const isLive = match.status === 'live';

  // List card, live: home score · running clock ring · away score in one row (no separate capsule).
  if (isLive && !large) {
    return (
      <View
        style={styles.liveCenter}
        accessible
        accessibilityLabel={`${match.score.home ?? 0} - ${match.score.away ?? 0}، ${matchStatusText(match)}`}
      >
        {/* RTL row: the home score sits on the right, next to the home team. */}
        <Text style={styles.liveScore}>{match.score.home ?? 0}</Text>
        <ClockRing match={match} size={42} stroke={3} fontSize={9} />
        <Text style={styles.liveScore}>{match.score.away ?? 0}</Text>
      </View>
    );
  }

  return (
    <View style={styles.centerStack}>
      <View style={[styles.capsule, isLive && styles.capsuleLive, large && styles.capsuleLarge]}>
        {/* Separate nodes so the home score stays on the right regardless of bidi rules. */}
        <View style={styles.scoreRow}>
          <Text style={[styles.score, large && styles.scoreLarge]}>{match.score.home ?? 0}</Text>
          <Text style={styles.scoreDash}>-</Text>
          <Text style={[styles.score, large && styles.scoreLarge]}>{match.score.away ?? 0}</Text>
        </View>
      </View>
      <View style={styles.statusRow}>
        {isLive && <View style={styles.liveDot} />}
        <Text style={[styles.statusText, isLive && styles.statusLive]}>{matchStatusText(match)}</Text>
      </View>
    </View>
  );
}

interface Props {
  match: Match;
  timeFormat: TimeFormat;
  /** IDs of favorite teams; matching teams get a star. */
  favorites: number[];
  onPress: (match: Match) => void;
}

function MatchCardBase({ match, timeFormat, favorites, onPress }: Props) {
  const homeFav = favorites.includes(match.homeTeam.id);
  const awayFav = favorites.includes(match.awayTeam.id);

  return (
    <HapticPressable
      onPress={() => onPress(match)}
      pressedOpacity={0.85}
      style={[styles.card, (homeFav || awayFav) && styles.cardFavorite]}
      accessibilityRole="button"
      accessibilityLabel={`${match.homeTeam.name} ضد ${match.awayTeam.name}`}
    >
      <View style={[styles.team, styles.teamHome]}>
        <TeamLogo team={match.homeTeam} size="md" />
        <Text style={styles.teamName} numberOfLines={2}>
          {match.homeTeam.name}
        </Text>
        {homeFav && <Icon name="star" active size={12} />}
      </View>

      <MatchCenter match={match} timeFormat={timeFormat} />

      <View style={[styles.team, styles.teamAway]}>
        {awayFav && <Icon name="star" active size={12} />}
        <Text style={styles.teamName} numberOfLines={2}>
          {match.awayTeam.name}
        </Text>
        <TeamLogo team={match.awayTeam} size="md" />
      </View>
    </HapticPressable>
  );
}

export const MatchCard = memo(MatchCardBase);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    minHeight: 64,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  cardFavorite: {
    borderColor: colors.primarySoft,
  },
  team: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  // Inside an RTL container, flex-start is the right edge and flex-end the left edge.
  teamHome: {
    justifyContent: 'flex-start',
  },
  teamAway: {
    justifyContent: 'flex-end',
  },
  teamName: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  liveCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.sm,
  },
  liveScore: {
    minWidth: 18,
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  centerStack: {
    alignItems: 'center',
    gap: 3,
  },
  capsule: {
    minWidth: 76,
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.capsule,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.sm,
  },
  capsuleLarge: {
    minWidth: 110,
    paddingVertical: 10,
  },
  capsuleLive: {
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  time: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    writingDirection: 'rtl',
    fontVariant: ['tabular-nums'],
  },
  timeLarge: {
    fontSize: 18,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  score: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  scoreLarge: {
    fontSize: 26,
  },
  scoreDash: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  statusLive: {
    color: colors.primary,
  },
});
