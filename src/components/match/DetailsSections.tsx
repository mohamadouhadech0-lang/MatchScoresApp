import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { TeamLogo } from '@/components/TeamLogo';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { Icon } from '@/components/ui/Icon';
import type { AsyncState } from '@/hooks/useAsyncData';
import { ar } from '@/i18n/ar';
import { colors, radius, spacing } from '@/theme';
import type { FormEntry, Match, MatchStatistic, Team } from '@/types/football';
import { SectionTitle } from './MatchSections';

const t = ar.details;

const RESULT_COLOR: Record<FormEntry['result'], string> = {
  W: colors.win,
  D: '#6B7686',
  L: colors.loss,
};

const shortDate = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
};

/** Loading / error placeholder shared by the sections below. */
function StateBox({ state }: { state: Exclude<AsyncState<unknown>, { status: 'ok' }> }) {
  return (
    <View style={styles.stateBox}>
      {state.status === 'loading' ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          <Icon name={state.planLimited ? 'hide' : 'close'} size="sm" color={colors.textMuted} />
          <Text style={styles.stateText}>{state.planLimited ? t.planLimited : t.loadFailed}</Text>
        </>
      )}
    </View>
  );
}

// ───────────── Last 5 ─────────────

function FormRow({ team, state }: { team: Team; state: AsyncState<FormEntry[]> }) {
  const [selected, setSelected] = useState<FormEntry | null>(null);

  return (
    <View style={styles.formTeam}>
      <View style={styles.formHeader}>
        <TeamLogo team={team} size="sm" />
        <Text style={styles.formTeamName} numberOfLines={1}>
          {team.name}
        </Text>
        {state.status === 'ok' && (
          // Newest result first (rightmost in RTL).
          <View style={styles.formDots}>
            {state.data.map((f) => {
              const active = selected?.matchId === f.matchId;
              return (
                <HapticPressable
                  key={f.matchId}
                  onPress={() => setSelected(active ? null : f)}
                  hitSlop={4}
                  style={[styles.formDot, { backgroundColor: RESULT_COLOR[f.result] }, active && styles.formDotActive]}
                  accessibilityRole="button"
                  accessibilityLabel={`${t.formResult[f.result]} ${t.vs} ${f.opponent.name} ${f.goalsFor}-${f.goalsAgainst}`}
                >
                  <Text style={styles.formLetter}>{t.formLetters[f.result]}</Text>
                </HapticPressable>
              );
            })}
          </View>
        )}
      </View>
      {state.status !== 'ok' && <StateBox state={state} />}
      {state.status === 'ok' && selected && (
        <View style={styles.formDetail}>
          <View style={[styles.resultTag, { backgroundColor: RESULT_COLOR[selected.result] }]}>
            <Text style={styles.resultTagText}>{t.formResult[selected.result]}</Text>
          </View>
          <Text style={styles.formDetailText} numberOfLines={1}>
            {`${t.vs} ${selected.opponent.name} · ${selected.isHome ? t.home : t.away}`}
          </Text>
          <Text style={styles.formScore}>{`⁦${selected.goalsFor} - ${selected.goalsAgainst}⁩`}</Text>
          <Text style={styles.formDate}>{shortDate(selected.date)}</Text>
        </View>
      )}
    </View>
  );
}

export function FormSection({
  home,
  away,
  homeForm,
  awayForm,
}: {
  home: Team;
  away: Team;
  homeForm: AsyncState<FormEntry[]>;
  awayForm: AsyncState<FormEntry[]>;
}) {
  return (
    <View style={styles.section}>
      <SectionTitle title={t.form} />
      <View style={styles.card}>
        <FormRow team={home} state={homeForm} />
        <View style={styles.divider} />
        <FormRow team={away} state={awayForm} />
      </View>
    </View>
  );
}

// ───────────── Head-to-head ─────────────

const PREVIEW = 3;

export function HeadToHeadSection({ home, away, state }: { home: Team; away: Team; state: AsyncState<Match[]> }) {
  const [expanded, setExpanded] = useState(false);

  if (state.status !== 'ok') {
    return (
      <View style={styles.section}>
        <SectionTitle title={t.h2h} />
        <StateBox state={state} />
      </View>
    );
  }

  const meetings = state.data;
  let homeWins = 0;
  let awayWins = 0;
  let draws = 0;
  for (const m of meetings) {
    const hg = m.score.home ?? 0;
    const ag = m.score.away ?? 0;
    if (hg === ag) draws++;
    else if (hg > ag === (m.homeTeam.id === home.id)) homeWins++;
    else awayWins++;
  }
  const total = Math.max(1, meetings.length);
  const shown = expanded ? meetings : meetings.slice(0, PREVIEW);

  return (
    <View style={styles.section}>
      <SectionTitle title={t.h2h} trailing={meetings.length ? t.h2hCount(meetings.length) : undefined} />
      <View style={styles.card}>
        {meetings.length === 0 ? (
          <Text style={styles.stateText}>{t.noH2H}</Text>
        ) : (
          <>
            <View style={styles.h2hSummary}>
              <View style={styles.h2hSide}>
                <TeamLogo team={home} size="lg" />
                <Text style={[styles.h2hNumber, { color: colors.home }]}>{homeWins}</Text>
                <Text style={styles.h2hLabel}>{t.wins}</Text>
              </View>
              <View style={styles.h2hSide}>
                <View style={styles.drawIcon}>
                  <Text style={styles.drawIconText}>=</Text>
                </View>
                <Text style={styles.h2hNumber}>{draws}</Text>
                <Text style={styles.h2hLabel}>{t.draws}</Text>
              </View>
              <View style={styles.h2hSide}>
                <TeamLogo team={away} size="lg" />
                <Text style={[styles.h2hNumber, { color: colors.away }]}>{awayWins}</Text>
                <Text style={styles.h2hLabel}>{t.wins}</Text>
              </View>
            </View>

            {/* Proportional bar: home wins (right) · draws · away wins (left). */}
            <View style={styles.h2hBar}>
              <View style={{ flex: homeWins / total, backgroundColor: colors.home }} />
              <View style={{ flex: draws / total, backgroundColor: '#6B7686' }} />
              <View style={{ flex: awayWins / total, backgroundColor: colors.away }} />
            </View>

            <View style={styles.meetings}>
              {shown.map((m) => {
                const hg = m.score.home ?? 0;
                const ag = m.score.away ?? 0;
                return (
                  <View key={m.id} style={styles.meeting}>
                    <View style={styles.meetingMeta}>
                      <Text style={styles.meetingDate}>{shortDate(m.kickoff)}</Text>
                      <Text style={styles.meetingLeague} numberOfLines={1}>
                        {m.league.name}
                      </Text>
                    </View>
                    <View style={styles.meetingTeams}>
                      <View style={[styles.meetingSide, styles.meetingSideHome]}>
                        <Text style={[styles.meetingTeam, hg > ag && styles.meetingWinner]} numberOfLines={1}>
                          {m.homeTeam.name}
                        </Text>
                      </View>
                      <View style={styles.meetingScore}>
                        <Text style={styles.meetingScoreText}>{hg}</Text>
                        <Text style={styles.meetingDash}>-</Text>
                        <Text style={styles.meetingScoreText}>{ag}</Text>
                      </View>
                      <View style={[styles.meetingSide, styles.meetingSideAway]}>
                        <Text style={[styles.meetingTeam, ag > hg && styles.meetingWinner]} numberOfLines={1}>
                          {m.awayTeam.name}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {meetings.length > PREVIEW && (
              <HapticPressable
                onPress={() => setExpanded((e) => !e)}
                style={styles.moreButton}
                accessibilityRole="button"
              >
                <Text style={styles.moreText}>{expanded ? t.showLess : t.showMore(meetings.length)}</Text>
                <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
                  <Icon name="arrowDown" size={14} color={colors.primary} />
                </View>
              </HapticPressable>
            )}
          </>
        )}
      </View>
    </View>
  );
}

// ───────────── Statistics ─────────────

export function StatsSection({ stats }: { stats: MatchStatistic[] }) {
  if (stats.length === 0) {
    return (
      <View style={styles.section}>
        <SectionTitle title={t.stats} />
        <View style={styles.stateBox}>
          <Icon name="standings" size="lg" color={colors.textMuted} />
          <Text style={styles.stateText}>{t.noStats}</Text>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.section}>
      <SectionTitle title={t.stats} />
      <View style={[styles.card, styles.statsCard]}>
        {stats.map((s) => {
          const sum = s.home + s.away || 1;
          const homeLeads = s.home > s.away;
          const awayLeads = s.away > s.home;
          const fmt = (v: number) => (s.isPercentage ? `${v}%` : String(v));
          return (
            <View key={s.key} style={styles.stat}>
              <View style={styles.statHeader}>
                <Text style={[styles.statValue, homeLeads && styles.statLead]}>{fmt(s.home)}</Text>
                <Text style={styles.statLabel}>{ar.stats[s.key]}</Text>
                <Text style={[styles.statValue, awayLeads && styles.statLeadAway]}>{fmt(s.away)}</Text>
              </View>
              <View style={styles.statBars}>
                {/* Each half grows from the centre outwards. */}
                <View style={[styles.statTrack, styles.statTrackHome]}>
                  <View
                    style={[
                      styles.statFill,
                      {
                        width: `${(s.home / sum) * 100}%`,
                        backgroundColor: homeLeads ? colors.primary : colors.textMuted,
                      },
                    ]}
                  />
                </View>
                <View style={[styles.statTrack, styles.statTrackAway]}>
                  <View
                    style={[
                      styles.statFill,
                      {
                        width: `${(s.away / sum) * 100}%`,
                        backgroundColor: awayLeads ? colors.away : colors.textMuted,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  stateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  stateText: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  // Form
  formTeam: {
    gap: spacing.sm,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  formTeamName: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  formDots: {
    flexDirection: 'row',
    gap: 6,
  },
  formDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  formDotActive: {
    borderColor: colors.text,
  },
  formLetter: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  formDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
  },
  resultTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  resultTagText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  formDetailText: {
    flex: 1,
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  formScore: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  formDate: {
    color: colors.textMuted,
    fontSize: 11,
  },
  // H2H
  h2hSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  h2hSide: {
    alignItems: 'center',
    gap: 4,
    minWidth: 70,
  },
  h2hNumber: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  h2hLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  drawIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawIconText: {
    color: colors.textSecondary,
    fontSize: 18,
    fontWeight: '900',
  },
  h2hBar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
    gap: 2,
  },
  meetings: {
    gap: spacing.sm,
  },
  meeting: {
    gap: 4,
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
  },
  meetingMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  meetingDate: {
    color: colors.textMuted,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  meetingLeague: {
    flexShrink: 1,
    color: colors.textMuted,
    fontSize: 11,
  },
  meetingTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  meetingSide: {
    flex: 1,
  },
  // Home hugs the right edge, away the left edge (RTL), regardless of native RTL state.
  meetingSideHome: {
    alignItems: 'flex-start',
  },
  meetingSideAway: {
    alignItems: 'flex-end',
  },
  meetingTeam: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  meetingWinner: {
    color: colors.text,
    fontWeight: '900',
  },
  meetingScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.capsule,
  },
  meetingScoreText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  meetingDash: {
    color: colors.textMuted,
    fontSize: 12,
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  moreText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  // Stats
  statsCard: {
    gap: spacing.lg,
  },
  stat: {
    gap: 6,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statValue: {
    minWidth: 44,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
  },
  statLead: {
    color: colors.primary,
  },
  statLeadAway: {
    color: colors.away,
  },
  statLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  statBars: {
    flexDirection: 'row',
    gap: 4,
  },
  statTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  // Home half (right in RTL) fills from the centre → right; away half from the centre → left.
  statTrackHome: {
    justifyContent: 'flex-end',
  },
  statTrackAway: {
    justifyContent: 'flex-start',
  },
  statFill: {
    height: '100%',
    borderRadius: 3,
  },
});
