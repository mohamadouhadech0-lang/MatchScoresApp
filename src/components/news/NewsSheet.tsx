import { StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { newsCategories, type NewsItem } from '@/data/mock/news';
import { ar } from '@/i18n/ar';
import { colors, radius, spacing } from '@/theme';
import { formatRelative } from '@/utils/format';
import { NewsCover } from './NewsCard';

/** Full article in a bottom sheet. */
export function NewsSheet({ item, onClose }: { item: NewsItem | null; onClose: () => void }) {
  return (
    <BottomSheet
      visible={!!item}
      onClose={onClose}
      title={item ? newsCategories[item.category] : ''}
      subtitle={item ? `${formatRelative(item.publishedAt)} · ${ar.newsPage.demo}` : undefined}
    >
      {item && (
        <>
          <View style={styles.cover}>
            <NewsCover item={item} height={180} />
          </View>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.summary}>{item.summary}</Text>
          <Text style={styles.body}>{item.body}</Text>
        </>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  cover: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  title: {
    alignSelf: 'flex-start',
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    lineHeight: 30,
    marginTop: spacing.sm,
  },
  summary: {
    alignSelf: 'flex-start',
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 22,
  },
  body: {
    alignSelf: 'flex-start',
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 26,
  },
});
