import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { CommunitySection } from '@/components/match/CommunitySection';
import { MatchBackdrop, MatchHero, MatchTopBar } from '@/components/match/MatchHeader';
import { CoachCard, LineupBench, LineupPitch } from '@/components/match/LineupPitch';
import { FormSection, HeadToHeadSection, StatsSection } from '@/components/match/DetailsSections';
import { EventsTimeline } from '@/components/match/EventsTimeline';
import { AuthGateProvider } from '@/components/match/AuthGate';
import { MatchInfoCard } from '@/components/match/MatchInfoCard';
import { PredictionCard } from '@/components/match/PredictionCard';
import { StatsSummaryCard } from '@/components/match/StatsSummaryCard';
import { ScorersList, SectionTitle } from '@/components/match/MatchSections';
import { NewsRow } from '@/components/news/NewsCard';
import { NewsSheet } from '@/components/news/NewsSheet';
import { RealStandings } from '@/components/RealStandings';
import { StandingsTable } from '@/components/StandingsTable';
import { TeamLogo } from '@/components/TeamLogo';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { RtlHorizontalScroll } from '@/components/ui/RtlHorizontalScroll';
import { config } from '@/config';
import { getGroupTable, getTopScorers } from '@/data/mock/matchExtras';
import { mockNews, type NewsItem } from '@/data/mock/news';
import { useAsyncData } from '@/hooks/useAsyncData';
import { ar } from '@/i18n/ar';
import { footballApi } from '@/services';
import { useSettings } from '@/services/settings/SettingsProvider';
import { colors, radius, spacing } from '@/theme';
import type { MatchDetails } from '@/types/football';
import { formatDayTitle, formatKickoff } from '@/utils/format';
import { haptics } from '@/utils/haptics';
import { hasLineups, hasStarted } from '@/utils/matchStatus';

const t = ar.matchDetails2;

type TabKey = keyof typeof t.tabs;
/** Order of the inner tabs (first = rightmost in RTL). */
const TABS: TabKey[] = ['events', 'stats', 'lineups', 'details', 'standings', 'scorers', 'news', 'community'];

/** Approximate heights used to size the backdrop behind the top bar and the tab strip. */
const BAR_HEIGHT = 56;
const TABS_HEIGHT = 56;

function useMatchDetails(id: number) {
  const [state, setState] = useState<{
    id: number;
    match: MatchDetails | null;
  } | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    footballApi
      .getMatchDetails(id)
      .then((match) => !cancelled && setState({ id, match }))
      .catch(() => !cancelled && setState({ id, match: null }));
    return () => {
      cancelled = true;
    };
  }, [id, reload]);

  const match = state?.id === id ? state.match : undefined;
  const status = match?.status;
  const kickoff = match?.kickoff;

  // Refresh while live, and also around kick-off for upcoming matches so line-ups (≈1h before)
  // and the first whistle (which unlocks Events / Statistics) appear without leaving the screen.
  useEffect(() => {
    if (status === 'live') {
      const timer = setInterval(() => setReload((r) => r + 1), config.livePollIntervalMs);
      return () => clearInterval(timer);
    }
    if (status !== 'scheduled' || !kickoff) return;
    let interval: ReturnType<typeof setInterval> | undefined;
    const startIn = Math.max(0, new Date(kickoff).getTime() - Date.now() - 60 * 60_000);
    const timeout = setTimeout(() => {
      setReload((r) => r + 1);
      interval = setInterval(() => setReload((r) => r + 1), config.livePollIntervalMs);
    }, startIn);
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, [status, kickoff]);

  return { match, loading: state?.id !== id };
}

export default function MatchDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = Number(id);
  const { match, loading } = useMatchDetails(matchId);
  const settings = useSettings();
  // Events & Statistics exist only once the match has kicked off (1H, HT, 2H, ET, P … FT).
  const started = !!match && hasStarted(match);
  const visibleTabs = started ? TABS : TABS.filter((k) => k !== 'events' && k !== 'stats');
  // null = automatic: "الأحداث" once started, otherwise "التفاصيل". A hidden selection falls back too.
  const [selectedTab, setSelectedTab] = useState<TabKey | null>(null);
  const tab: TabKey = selectedTab && visibleTabs.includes(selectedTab) ? selectedTab : started ? 'events' : 'details';
  const [lineupSide, setLineupSide] = useState<0 | 1>(0);
  const [openNews, setOpenNews] = useState<NewsItem | null>(null);

  // Collapsing header: the big hero fades away and the top bar turns into a mini scoreboard.
  const insets = useSafeAreaInsets();
  const [scrollY] = useState(() => new Animated.Value(0));
  const [heroHeight, setHeroHeight] = useState(220);
  const header = useMemo(
    () => ({
      // 0 → 1 over the last few pixels before the tab strip pins under the app bar.
      stuck: scrollY.interpolate({
        inputRange: [Math.max(0, heroHeight - 12), heroHeight],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
      collapse: scrollY.interpolate({
        inputRange: [heroHeight * 0.45, heroHeight * 0.85],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
      // The backdrop scrolls away with the header, leaving its upper wash behind the top bar.
      backdropStyle: {
        transform: [
          {
            translateY: scrollY.interpolate({
              inputRange: [0, heroHeight],
              outputRange: [0, -heroHeight],
              extrapolate: 'clamp',
            }),
          },
        ],
      },
      heroStyle: {
        opacity: scrollY.interpolate({ inputRange: [0, heroHeight * 0.75], outputRange: [1, 0], extrapolate: 'clamp' }),
        // Fade + gentle shrink only: no translate, so it never slides under the pinned tabs.
        transform: [
          { scale: scrollY.interpolate({ inputRange: [0, heroHeight], outputRange: [1, 0.96], extrapolate: 'clamp' }) },
        ],
      },
    }),
    [scrollY, heroHeight],
  );
  const onScroll = useMemo(
    () => Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true }),
    [scrollY],
  );

  // Switching tabs never leaves the header half-faded: snap to fully open or fully collapsed,
  // so it looks the same on every tab (Events, Lineups, …).
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const lastY = useRef(0);
  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      lastY.current = value;
    });
    return () => scrollY.removeListener(id);
  }, [scrollY]);
  const setTab = useCallback(
    (key: TabKey) => {
      setSelectedTab(key);
      const y = lastY.current;
      if (y <= 0) return;
      if (y < heroHeight * 0.6) scrollRef.current?.scrollTo({ y: 0, animated: true });
      else scrollRef.current?.scrollTo({ y: heroHeight, animated: false });
    },
    [heroHeight],
  );

  // Demo group table / scorers only make sense for mock fixtures.
  const groupTable = useMemo(() => (match && !config.usingRealData ? getGroupTable(match) : []), [match]);
  const leagueId = match?.league.id;
  const mockScorers = useMemo(() => (config.usingRealData ? [] : getTopScorers(leagueId)), [leagueId]);

  // Loaded lazily per tab to save API quota (responses are cached in the data source).
  const homeId = match?.homeTeam.id;
  const awayId = match?.awayTeam.id;
  const detailsOpen = tab === 'details' && homeId !== undefined && awayId !== undefined;
  const homeForm = useAsyncData(detailsOpen ? `form:${homeId}` : null, () => footballApi.getTeamForm(homeId!));
  const awayForm = useAsyncData(detailsOpen ? `form:${awayId}` : null, () => footballApi.getTeamForm(awayId!));
  const h2h = useAsyncData(detailsOpen ? `h2h:${homeId}-${awayId}` : null, () =>
    footballApi.getHeadToHead(homeId!, awayId!),
  );
  const realScorers = useAsyncData(
    config.usingRealData && tab === 'scorers' && match ? `scorers:${match.league.id}:${match.league.season}` : null,
    () => footballApi.getTopScorers(match!.league),
  );
  const relatedNews = useMemo(
    () =>
      match ? mockNews.filter((n) => n.tags.includes(match.homeTeam.name) || n.tags.includes(match.awayTeam.name)) : [],
    [match],
  );

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (loading || !match) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <MatchTopBar
          leagueName=""
          alertsOn={false}
          onBack={goBack}
          onShare={() => undefined}
          onToggleAlerts={() => undefined}
        />
        <View style={styles.center}>
          {loading ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.muted}>{t.notFound}</Text>}
        </View>
      </SafeAreaView>
    );
  }

  const alertsOn = settings.matchAlerts.includes(match.id);
  const share = () =>
    Share.share({
      message: t.shareMessage(
        match.homeTeam.name,
        match.awayTeam.name,
        `${formatDayTitle(new Date(match.kickoff))} · ${formatKickoff(match.kickoff, settings.timeFormat)}`,
        match.league.name,
      ),
    }).catch(() => undefined);

  const toggleAlerts = () => {
    if (!alertsOn) haptics.success();
    settings.toggleIn('matchAlerts', match.id);
  };

  return (
    <View style={styles.root}>
      {/* Full-bleed gradient from the very top (under the status bar) to below the tabs. */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.backdrop,
          { height: insets.top + BAR_HEIGHT + heroHeight + TABS_HEIGHT + 40 },
          header.backdropStyle,
        ]}
      >
        <MatchBackdrop match={match} />
      </Animated.View>
      {/*
        Fixed top chrome: the status-bar inset is explicit padding, then the app bar (title → mini
        scoreboard). It sits above the scroll area (zIndex/elevation) and turns solid once the header
        has collapsed, so nothing ever scrolls into the status bar or behind the system buttons.
      */}
      <View style={[styles.chrome, { paddingTop: insets.top }]}>
        <Animated.View style={[styles.chromeFill, { opacity: header.collapse }]} pointerEvents="none" />
        <MatchTopBar
          leagueName={match.league.name}
          alertsOn={alertsOn}
          onBack={goBack}
          onShare={share}
          onToggleAlerts={toggleAlerts}
          match={match}
          timeFormat={settings.timeFormat}
          collapse={header.collapse}
        />
      </View>
      {/* The scroll area starts below the chrome and clips its content: the pinned tabs stop right under the app bar. */}
      <KeyboardAvoidingView style={styles.scrollArea} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.ScrollView
          ref={scrollRef}
          onScroll={onScroll}
          scrollEventThrottle={16}
          stickyHeaderIndices={[1]}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={header.heroStyle}
            onLayout={(e) => setHeroHeight(Math.max(120, e.nativeEvent.layout.height))}
          >
            <MatchHero match={match} timeFormat={settings.timeFormat} />
          </Animated.View>

          {/* Sticky inner tab strip (stays under the top bar; divider appears once collapsed) */}
          <View style={styles.tabsWrap}>
            {/* Transparent over the backdrop; turns solid once pinned so content never shows through. */}
            <Animated.View style={[styles.tabsFill, { opacity: header.stuck }]} pointerEvents="none" />
            <Animated.View style={[styles.tabsDivider, { opacity: header.stuck }]} pointerEvents="none" />
            <RtlHorizontalScroll contentContainerStyle={styles.tabs}>
              {visibleTabs.map((key) => {
                const active = key === tab;
                return (
                  <HapticPressable
                    key={key}
                    onPress={() => setTab(key)}
                    style={[styles.tab, active && styles.tabActive]}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.tabs[key]}</Text>
                  </HapticPressable>
                );
              })}
            </RtlHorizontalScroll>
          </View>

          <View style={styles.body}>
            {tab === 'details' && (
              <>
                {started && <StatsSummaryCard match={match} onShowMore={() => setTab('stats')} />}
                <MatchInfoCard match={match} timeFormat={settings.timeFormat} />
                <FormSection home={match.homeTeam} away={match.awayTeam} homeForm={homeForm} awayForm={awayForm} />
                <HeadToHeadSection home={match.homeTeam} away={match.awayTeam} state={h2h} />
              </>
            )}

            {tab === 'events' && started && <EventsTimeline match={match} />}

            {tab === 'stats' && started && <StatsSection stats={match.statistics} />}

            {tab === 'lineups' && !hasLineups(match) && (
              <EmptyState
                icon="lineups"
                title={ar.matchState.lineupsTitle}
                subtitle={started ? ar.matchState.lineupsMissing : ar.matchState.lineupsBeforeKickoff}
              />
            )}

            {tab === 'lineups' && hasLineups(match) && match.lineups && (
              <>
                <View style={styles.segment}>
                  {match.lineups.map((l, i) => (
                    <HapticPressable
                      key={l.team.id}
                      onPress={() => setLineupSide(i as 0 | 1)}
                      style={[styles.segmentItem, lineupSide === i && styles.segmentActive]}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: lineupSide === i }}
                    >
                      <TeamLogo team={l.team} size="sm" />
                      <Text style={[styles.segmentText, lineupSide === i && styles.segmentTextActive]}>
                        {l.team.name}
                      </Text>
                    </HapticPressable>
                  ))}
                </View>
                <LineupPitch lineup={match.lineups[lineupSide]} events={match.events} />
                {!config.usingRealData && <Text style={styles.note}>{t.lineupNote}</Text>}
                <LineupBench lineup={match.lineups[lineupSide]} events={match.events} />
                <CoachCard lineup={match.lineups[lineupSide]} />
              </>
            )}

            {tab === 'standings' && (
              <View style={styles.section}>
                <SectionTitle title={t.groupTable} trailing={match.round} />
                {config.usingRealData ? (
                  <RealStandings league={match.league} highlightIds={[match.homeTeam.id, match.awayTeam.id]} />
                ) : (
                  <StandingsTable rows={groupTable} highlightIds={[match.homeTeam.id, match.awayTeam.id]} />
                )}
              </View>
            )}

            {tab === 'scorers' &&
              (!config.usingRealData ? (
                <ScorersList scorers={mockScorers} />
              ) : realScorers.status === 'ok' && realScorers.data.scorers.length > 0 ? (
                <>
                  {realScorers.data.season !== match.league.season && (
                    <View style={styles.notice}>
                      <Icon name="time" size={16} color={colors.yellowCard} />
                      <Text style={styles.noticeText}>{ar.details.olderSeason(realScorers.data.season)}</Text>
                    </View>
                  )}
                  <ScorersList scorers={realScorers.data.scorers} />
                </>
              ) : (
                <View style={styles.empty}>
                  {realScorers.status === 'loading' ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <>
                      <Icon name="podium" size="lg" color={colors.textMuted} />
                      <Text style={styles.muted}>{ar.realData.scorersUnavailable}</Text>
                    </>
                  )}
                </View>
              ))}

            {tab === 'news' &&
              (relatedNews.length ? (
                <View style={styles.section}>
                  {relatedNews.map((n) => (
                    <NewsRow key={n.id} item={n} onPress={setOpenNews} />
                  ))}
                </View>
              ) : (
                <View style={styles.empty}>
                  <Icon name="news" size="lg" color={colors.textMuted} />
                  <Text style={styles.muted}>{t.noNews}</Text>
                </View>
              ))}

            {tab === 'community' && (
              <AuthGateProvider>
                <PredictionCard match={match} />
                <CommunitySection matchId={match.id} />
              </AuthGateProvider>
            )}
          </View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>

      <NewsSheet item={openNews} onClose={() => setOpenNews(null)} />
    </View>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingBottom: spacing.xxl,
  },
  chrome: {
    zIndex: 3,
    elevation: 3,
  },
  chromeFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
  },
  scrollArea: {
    flex: 1,
    overflow: 'hidden',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  tabsWrap: {
    // Almost no top padding: once pinned, the chips sit directly under the app bar / mini scoreboard.
    paddingTop: 2,
    paddingBottom: spacing.sm,
    // Pinned strip draws above the scrolling content on both platforms.
    zIndex: 2,
    elevation: 2,
  },
  tabsFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
  },
  tabsDivider: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  tabs: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    // Glassy chips that read well both over the gradient and on the plain background.
    backgroundColor: 'rgba(27, 34, 44, 0.78)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.xl,
  },
  section: {
    gap: spacing.md,
  },
  segment: {
    flexDirection: 'row',
    padding: 4,
    gap: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 38,
    borderRadius: radius.pill,
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: colors.background,
    fontWeight: '800',
  },
  note: {
    alignSelf: 'center',
    color: colors.textMuted,
    fontSize: 12,
    marginTop: -spacing.md,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xxl,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
  },
  noticeText: {
    flex: 1,
    color: colors.yellowCard,
    fontSize: 12,
    fontWeight: '600',
  },
  muted: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
