import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';

import { colors } from '@/theme';

type IonName = ComponentProps<typeof Ionicons>['name'];

/**
 * Single source of truth for every icon in the app.
 * Each semantic name maps to an outline glyph (inactive) and a filled glyph (active),
 * so all screens share the same Ionicons style, sizes and colors.
 */
const ICONS = {
  // Tabs
  matches: ['football-outline', 'football'],
  news: ['newspaper-outline', 'newspaper'],
  contest: ['gift-outline', 'gift'],
  standings: ['stats-chart-outline', 'stats-chart'],
  more: ['ellipsis-horizontal-circle-outline', 'ellipsis-horizontal-circle'],
  // Header
  filter: ['funnel-outline', 'funnel'],
  search: ['search-outline', 'search'],
  calendar: ['calendar-outline', 'calendar'],
  chevronRight: ['chevron-forward', 'chevron-forward'],
  chevronLeft: ['chevron-back', 'chevron-back'],
  // Lists
  trophy: ['trophy-outline', 'trophy'],
  dots: ['ellipsis-horizontal', 'ellipsis-horizontal'],
  // Settings
  language: ['globe-outline', 'globe'],
  darkMode: ['moon-outline', 'moon'],
  comments: ['chatbubble-ellipses-outline', 'chatbubble-ellipses'],
  notifications: ['notifications-outline', 'notifications'],
  time: ['time-outline', 'time'],
  sort: ['bar-chart-outline', 'bar-chart'],
  widgets: ['grid-outline', 'grid'],
  star: ['star-outline', 'star'],
  transfers: ['swap-horizontal-outline', 'swap-horizontal'],
  person: ['person-outline', 'person'],
  google: ['logo-google', 'logo-google'],
  signOut: ['log-out-outline', 'log-out'],
  // Match details & community
  share: ['share-social-outline', 'share-social'],
  send: ['send', 'send'],
  like: ['thumbs-up-outline', 'thumbs-up'],
  dislike: ['thumbs-down-outline', 'thumbs-down'],
  reply: ['arrow-undo-outline', 'arrow-undo'],
  card: ['square', 'square'],
  substitution: ['swap-vertical-outline', 'swap-vertical'],
  tv: ['tv-outline', 'tv'],
  venue: ['location-outline', 'location'],
  round: ['flag-outline', 'flag'],
  referee: ['person-circle-outline', 'person-circle'],
  community: ['chatbubbles-outline', 'chatbubbles'],
  lineups: ['people-outline', 'people'],
  podium: ['podium-outline', 'podium'],
  // Leagues & news
  arrowUp: ['arrow-up', 'arrow-up'],
  arrowDown: ['arrow-down', 'arrow-down'],
  hide: ['eye-off-outline', 'eye-off'],
  show: ['eye-outline', 'eye'],
  options: ['options-outline', 'options'],
  reorder: ['reorder-three', 'reorder-three'],
  // Data / connectivity states
  refresh: ['refresh-outline', 'refresh'],
  offline: ['cloud-offline-outline', 'cloud-offline'],
  quota: ['hourglass-outline', 'hourglass'],
  key: ['key-outline', 'key'],
  lock: ['lock-closed-outline', 'lock-closed'],
  server: ['server-outline', 'server'],
  alert: ['alert-circle-outline', 'alert-circle'],
  // Generic
  close: ['close', 'close'],
  check: ['checkmark', 'checkmark'],
  radio: ['radio-button-off', 'radio-button-on'],
} satisfies Record<string, [IonName, IonName]>;

export type IconName = keyof typeof ICONS;

export const iconSize = {
  sm: 18,
  md: 22,
  lg: 26,
} as const;

interface Props {
  name: IconName;
  /** Filled glyph + accent color. */
  active?: boolean;
  size?: keyof typeof iconSize | number;
  /** Overrides the default (white / mint when active). */
  color?: string;
}

export function Icon({ name, active = false, size = 'md', color }: Props) {
  const [outline, filled] = ICONS[name];
  return (
    <Ionicons
      name={active ? filled : outline}
      size={typeof size === 'number' ? size : iconSize[size]}
      color={color ?? (active ? colors.primary : colors.text)}
    />
  );
}
