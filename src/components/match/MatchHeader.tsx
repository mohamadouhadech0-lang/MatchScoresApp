import { useEffect, useState } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Animated, StyleSheet, Text, View } from 'react-native';

import { MatchCenter } from '@/components/MatchCard';
import { TeamLogo } from '@/components/TeamLogo';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ar } from '@/i18n/ar';
import type { TimeFormat } from '@/services/settings/SettingsProvider';
import { colors, radius, spacing } from '@/theme';
import type { Match, Team } from '@/types/football';
import { formatDayTitle, formatKickoff } from '@/utils/format';
import { LiveScoreboard } from './LiveScoreboard';

const t = ar.matchDetails2;
/** Header crest / flag size: a little under `logoSize.hero` (64) to leave room for the score and clock. */
const HERO_LOGO = 50;

function BarButton({
  icon,
  label,
  onPress,
  active,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <HapticPressable
      onPress={onPress}
      hitSlop={6}
      style={[styles.barButton, active && styles.barButtonActive]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: !!active }}
    >
      <Icon name={icon} active={active} />
    </HapticPressable>
  );
}

interface TopBarProps {
  leagueName: string;
  alertsOn: boolean;
  onBack: () => void;
  onShare: () => void;
  onToggleAlerts: () => void;
  /** When given, the title cross-fades into this match's mini scoreboard as `collapse` goes 0 → 1. */
  match?: Match;
  timeFormat?: TimeFormat;
  collapse?: Animated.AnimatedInterpolation<number>;
}

/** Compact "🛡 name 2 - 1 name 🛡" strip shown in the top bar once the big header scrolls away. */
function MiniScore({ match, timeFormat }: { match: Match; timeFormat: TimeFormat }) {
  const scheduled = match.status === 'scheduled';
  const live = match.status === 'live';
  const sub = live
    ? match.phase === 'half_time'
      ? ar.phase.half_time
      : `${match.minute ?? ''}'`
    : scheduled
      ? formatDayTitle(new Date(match.kickoff))
      : ar.filters.finished;
  return (
    <View
      style={styles.mini}
      accessible
      accessibilityLabel={`${match.homeTeam.name} ${match.score.home ?? ''} - ${match.score.away ?? ''} ${match.awayTeam.name}`}
    >
      <View style={[styles.miniTeam, styles.miniTeamHome]}>
        <TeamLogo team={match.homeTeam} size="xs" />
        <Text style={styles.miniName} numberOfLines={1}>
          {match.homeTeam.name}
        </Text>
      </View>
      <View style={styles.miniCenter}>
        {scheduled ? (
          <Text style={styles.miniTime}>{formatKickoff(match.kickoff, timeFormat)}</Text>
        ) : (
          // Separate nodes keep the home score on the right (RTL).
          <View style={styles.miniScoreRow}>
            <Text style={[styles.miniScore, live && styles.miniScoreLive]}>{match.score.home ?? 0}</Text>
            <Text style={styles.miniDash}>-</Text>
            <Text style={[styles.miniScore, live && styles.miniScoreLive]}>{match.score.away ?? 0}</Text>
          </View>
        )}
        <View style={styles.miniStatus}>
          {live && <View style={styles.miniLiveDot} />}
          <Text style={[styles.miniSub, live && styles.miniSubLive]} numberOfLines={1}>
            {sub}
          </Text>
        </View>
      </View>
      <View style={[styles.miniTeam, styles.miniTeamAway]}>
        <Text style={styles.miniName} numberOfLines={1}>
          {match.awayTeam.name}
        </Text>
        <TeamLogo team={match.awayTeam} size="xs" />
      </View>
    </View>
  );
}

/** Back (right) · league title with crest (or the mini scoreboard when collapsed) · share + alerts (left). */
export function MatchTopBar({
  leagueName,
  alertsOn,
  onBack,
  onShare,
  onToggleAlerts,
  match,
  timeFormat = '12h',
  collapse,
}: TopBarProps) {
  const titleStyle = collapse
    ? {
        // Sequential, never overlapping: the title is gone before the mini scoreboard appears.
        opacity: collapse.interpolate({ inputRange: [0, 0.45], outputRange: [1, 0], extrapolate: 'clamp' }),
        transform: [
          { translateY: collapse.interpolate({ inputRange: [0, 0.45], outputRange: [0, -8], extrapolate: 'clamp' }) },
        ],
      }
    : null;
  const miniStyle = collapse
    ? {
        opacity: collapse.interpolate({ inputRange: [0.55, 1], outputRange: [0, 1], extrapolate: 'clamp' }),
        transform: [
          { translateY: collapse.interpolate({ inputRange: [0.55, 1], outputRange: [8, 0], extrapolate: 'clamp' }) },
        ],
      }
    : null;
  return (
    <View style={styles.bar}>
      <BarButton icon="chevronRight" label={t.back} onPress={onBack} />
      <View style={styles.barTitle}>
        <Animated.View style={[styles.titleLayer, titleStyle]}>
          <View style={styles.leagueCrest}>
            <Icon name="trophy" active size={14} />
          </View>
          <Text style={styles.leagueName} numberOfLines={1}>
            {leagueName}
          </Text>
        </Animated.View>
        {match && collapse ? (
          <Animated.View style={[styles.miniLayer, miniStyle]} pointerEvents="none">
            <MiniScore match={match} timeFormat={timeFormat} />
          </Animated.View>
        ) : null}
      </View>
      <BarButton icon="share" label={t.share} onPress={onShare} />
      <BarButton
        icon="notifications"
        label={alertsOn ? t.alertsOn : t.alertsOff}
        onPress={onToggleAlerts}
        active={alertsOn}
      />
    </View>
  );
}

/** Compact live countdown to kick-off, shown under the date: "02س 14د 09ث" (or "3ي 04س 12د"). */
function Countdown({ kickoff }: { kickoff: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const diff = Math.max(0, new Date(kickoff).getTime() - now);
  // Only count down during the final week.
  if (diff > 7 * 86400_000) return null;
  const totalSec = Math.floor(diff / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const u = t.countdownUnits;

  const cells: [number, string][] =
    d > 0
      ? [
          [d, u.d],
          [h, u.h],
          [m, u.m],
        ]
      : [
          [h, u.h],
          [m, u.m],
          [s, u.s],
        ];

  return (
    <View
      style={styles.countdown}
      accessible
      accessibilityLabel={`${t.startsIn} ${cells.map(([value, unit]) => `${value}${unit}`).join(' ')}`}
    >
      <Text style={styles.countdownLabel}>{t.startsIn}</Text>
      <View style={styles.countdownPill}>
        {cells.map(([value, unit]) => (
          <Text key={unit} style={styles.countValue}>
            {pad(value)}
            <Text style={styles.countUnit}>{unit}</Text>
          </Text>
        ))}
      </View>
    </View>
  );
}

function HeroTeam({ team }: { team: Team }) {
  return (
    <View style={styles.heroTeam}>
      <TeamLogo team={team} size={HERO_LOGO} />
      <Text style={styles.heroName} numberOfLines={2}>
        {team.name}
      </Text>
      {team.fifaRank ? (
        <View style={styles.fifa}>
          <Text style={styles.fifaText}>{t.fifa(team.fifaRank)}</Text>
        </View>
      ) : null}
    </View>
  );
}

/** Face-off card: teams, FIFA ranks, score / kick-off time and countdown. */
/** "#RRGGBB" → rgba() with the given alpha; falls back when the team has no brand color. */
function tint(hex: string | undefined, fallback: string, alpha: number): string {
  const value = hex && /^#[0-9a-f]{6}$/i.test(hex) ? hex : fallback;
  const n = Number.parseInt(value.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/**
 * Full-bleed backdrop behind the top of the match screen (status bar → top bar → header → tabs),
 * identical on every tab: both team colors washed in from their side (home right, away left in
 * RTL), a soft highlight at the top, and a long fade into the page color so there is no hard edge.
 */
export function MatchBackdrop({ match }: { match: Match }) {
  return (
    <>
      <LinearGradient
        colors={[
          tint(match.homeTeam.color, colors.home, 0.42),
          tint(match.homeTeam.color, colors.home, 0.12),
          'rgba(13,17,23,0)',
          tint(match.awayTeam.color, colors.away, 0.12),
          tint(match.awayTeam.color, colors.away, 0.42),
        ]}
        locations={[0, 0.3, 0.5, 0.7, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 0.6 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(255,255,255,0.08)', 'rgba(13,17,23,0)', 'rgba(13,17,23,0)', colors.background]}
        locations={[0, 0.3, 0.62, 1]}
        style={StyleSheet.absoluteFill}
      />
    </>
  );
}

export function MatchHero({ match, timeFormat }: { match: Match; timeFormat: TimeFormat }) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroRow}>
        <HeroTeam team={match.homeTeam} />
        <View style={styles.heroCenter}>
          {match.status === 'live' ? (
            <LiveScoreboard match={match} />
          ) : (
            <MatchCenter match={match} timeFormat={timeFormat} large />
          )}
          <Text style={styles.heroDate}>{formatDayTitle(new Date(match.kickoff))}</Text>
          {match.status === 'scheduled' && <Countdown kickoff={match.kickoff} />}
        </View>
        <HeroTeam team={match.awayTeam} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    // Tight bottom edge: the pinned tabs sit right under it.
    paddingBottom: spacing.xs,
  },
  barButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barButtonActive: {
    backgroundColor: colors.primarySoft,
  },
  barTitle: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
  },
  titleLayer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  miniLayer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
  },
  mini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniTeam: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minWidth: 0,
  },
  // RTL: home hugs the score from the right, away from the left.
  miniTeamHome: {
    justifyContent: 'flex-start',
  },
  miniTeamAway: {
    justifyContent: 'flex-end',
  },
  miniName: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  miniCenter: {
    alignItems: 'center',
    minWidth: 52,
  },
  miniScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  miniScore: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  miniScoreLive: {
    color: colors.primary,
  },
  miniDash: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  miniTime: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  miniStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  miniLiveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.live,
  },
  miniSub: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  miniSubLive: {
    color: colors.live,
  },
  leagueCrest: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leagueName: {
    flexShrink: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  // Open layout: no card frame, the screen backdrop (MatchBackdrop) shows through.
  hero: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    // Room above the tabs while expanded (the tab strip itself has almost no top padding).
    paddingBottom: spacing.lg + spacing.md,
    gap: spacing.lg,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  heroTeam: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  fifa: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.capsule,
    borderWidth: 1,
    borderColor: colors.border,
  },
  fifaText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  heroCenter: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  heroDate: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  countdown: {
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  countdownLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  countdownPill: {
    // Numbers read hours → seconds left-to-right, like a clock.
    direction: 'ltr',
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  countValue: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  countUnit: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
  },
});
