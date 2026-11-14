import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { EntityAvatar } from '@/components/search/EntityAvatar';
import { HapticPressable } from '@/components/ui/HapticPressable';
import { Icon } from '@/components/ui/Icon';
import { newsCategories, newsEntity, type NewsItem } from '@/data/mock/news';
import { colors, radius, spacing } from '@/theme';
import { formatRelative } from '@/utils/format';

/** Generated cover art: brand-colored gradient, subtle pitch lines and the featured crests. */
export function NewsCover({ item, height }: { item: NewsItem; height: number }) {
  const entities = item.cover.entities.map(newsEntity).filter((e) => !!e);
  const size = Math.round(height * 0.38);
  return (
    <LinearGradient colors={item.cover.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height }}>
      {/* Pitch markings */}
      <View style={[styles.pitchCircle, { width: height * 0.9, height: height * 0.9, borderRadius: height }]} />
      <View style={styles.pitchLine} />
      <View style={styles.crests}>
        {entities.map((e) => (
          <View key={e.name} style={styles.crestShadow}>
            <EntityAvatar entity={e} size={size} />
          </View>
        ))}
      </View>
      <LinearGradient colors={['transparent', 'rgba(13,17,23,0.95)']} style={styles.fade} />
    </LinearGradient>
  );
}

function Meta({ item }: { item: NewsItem }) {
  return (
    <View style={styles.meta}>
      <View style={styles.categoryPill}>
        <Text style={styles.categoryText}>{newsCategories[item.category]}</Text>
      </View>
      <Icon name="time" size={12} color={colors.textMuted} />
      <Text style={styles.metaText}>{formatRelative(item.publishedAt)}</Text>
    </View>
  );
}

/** Large card with cover + bold headline. */
export function NewsCard({ item, onPress }: { item: NewsItem; onPress: (item: NewsItem) => void }) {
  return (
    <HapticPressable onPress={() => onPress(item)} pressedOpacity={0.85} style={styles.card} accessibilityRole="button">
      <NewsCover item={item} height={item.featured ? 190 : 150} />
      <View style={styles.body}>
        <Meta item={item} />
        <Text style={[styles.title, item.featured && styles.titleFeatured]} numberOfLines={3}>
          {item.title}
        </Text>
        <Text style={styles.summary} numberOfLines={2}>
          {item.summary}
        </Text>
      </View>
    </HapticPressable>
  );
}

/** Compact row: thumbnail + headline. */
export function NewsRow({ item, onPress }: { item: NewsItem; onPress: (item: NewsItem) => void }) {
  return (
    <HapticPressable onPress={() => onPress(item)} pressedOpacity={0.85} style={styles.row} accessibilityRole="button">
      <View style={styles.thumb}>
        <NewsCover item={item} height={84} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={3}>
          {item.title}
        </Text>
        <Meta item={item} />
      </View>
    </HapticPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  pitchCircle: {
    position: 'absolute',
    alignSelf: 'center',
    top: '5%',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  pitchLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    alignSelf: 'center',
    width: 1.5,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  crests: {
    ...StyleSheet.absoluteFill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  crestShadow: {
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  fade: {
    position: 'absolute',
    start: 0,
    end: 0,
    bottom: 0,
    height: '45%',
  },
  body: {
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  categoryText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 25,
  },
  titleFeatured: {
    fontSize: 20,
    lineHeight: 29,
  },
  summary: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  thumb: {
    width: 110,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  rowBody: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
  },
});
