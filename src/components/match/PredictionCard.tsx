import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { TeamLogo } from '@/components/TeamLogo';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { Icon } from '@/components/ui/Icon';
import { ar } from '@/i18n/ar';
import { usePredictions, type PredictionPick } from '@/services/predictions/PredictionsProvider';
import { radius, spacing } from '@/theme';
import type { Match, Team } from '@/types/football';

const t = ar.prediction;

const GRADIENT = ['#5B2EE8', '#3B4FE0', '#1D6FD8'] as const;
const ACCENT = GRADIENT[0];

/** Rounds to whole percentages that always add up to 100. */
function percentages(values: number[]): number[] {
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const raw = values.map((v) => (v / total) * 100);
  const floored = raw.map(Math.floor);
  let rest = 100 - floored.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => [v - floored[i], i] as const).sort((a, b) => b[0] - a[0]);
  for (const [, i] of order) {
    if (rest-- <= 0) break;
    floored[i] += 1;
  }
  return floored;
}

/**
 * Compact "توقع الفائز": home win (right) · draw (middle) · away win (left).
 * Open to everyone, guests included. No counts or percentages are shown until the user picks;
 * then each option gets its share as a thin bar + percentage. The pick can be changed.
 */
export function PredictionCard({ match }: { match: Match }) {
  const { getTally, picks, predict } = usePredictions();
  const tally = getTally(match.id);
  const mine = picks[match.id];
  const voted = !!mine;
  const [pHome, pDraw, pAway] = percentages([tally.home, tally.draw, tally.away]);

  const options: { pick: PredictionPick; label: string; percent: number; team?: Team }[] = [
    { pick: 'home', label: t.win, percent: pHome, team: match.homeTeam },
    { pick: 'draw', label: t.draw, percent: pDraw },
    { pick: 'away', label: t.win, percent: pAway, team: match.awayTeam },
  ];

  return (
    <LinearGradient colors={GRADIENT} start={{ x: 1, y: 0 }} end={{ x: 0, y: 1 }} style={styles.card}>
      <View style={styles.header}>
        <Icon name="podium" active size={14} color="#FFFFFF" />
        <Text style={styles.title}>{t.title}</Text>
        <View style={styles.flex} />
        {voted ? <Text style={styles.votes}>{t.votes(tally.total)}</Text> : null}
      </View>

      <View style={styles.options}>
        {options.map(({ pick, label, percent, team }) => {
          const selected = mine === pick;
          return (
            <View key={pick} style={styles.option}>
              <HapticPressable
                feedback="impact"
                onPress={() => predict(match.id, pick)}
                style={[styles.button, selected && styles.buttonSelected]}
                accessibilityRole="button"
                accessibilityLabel={team ? t.winA11y(team.name) : t.draw}
                accessibilityState={{ selected }}
                accessibilityValue={voted ? { text: `${percent}%` } : undefined}
              >
                {team ? (
                  <TeamLogo team={team} size="xs" />
                ) : (
                  <Text style={[styles.drawMark, selected && styles.textSelected]}>X</Text>
                )}
                <Text style={[styles.label, selected && styles.textSelected]} numberOfLines={1}>
                  {label}
                </Text>
              </HapticPressable>

              {voted ? (
                <View style={styles.result}>
                  <View style={styles.track}>
                    <View style={[styles.fill, { width: `${percent}%` }, selected && styles.fillSelected]} />
                  </View>
                  <Text style={[styles.percent, selected && styles.percentSelected]}>{`${percent}%`}</Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  flex: {
    flex: 1,
  },
  votes: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '600',
  },
  options: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  option: {
    flex: 1,
    gap: 6,
  },
  button: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  buttonSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  drawMark: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  label: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  textSelected: {
    color: ACCENT,
  },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  track: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  fillSelected: {
    backgroundColor: '#FFFFFF',
  },
  percent: {
    minWidth: 30,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    textAlign: 'left',
  },
  percentSelected: {
    color: '#FFFFFF',
  },
});
