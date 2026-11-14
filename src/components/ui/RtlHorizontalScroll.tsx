import { useRef, type ComponentRef, type ReactNode } from 'react';
import { I18nManager, ScrollView, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

interface Props {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
}

/**
 * Horizontal scroller that starts at the right edge in our forced-RTL layout.
 *
 * Screens use `direction: 'rtl'` so the layout is right-to-left even when the native RTL flag
 * isn't active yet (e.g. first launch in Expo Go). In that case the ScrollView itself still
 * starts at offset 0 (the left), so we jump to the end once the content is measured.
 */
export function RtlHorizontalScroll({ children, contentContainerStyle }: Props) {
  const ref = useRef<ComponentRef<typeof ScrollView>>(null);
  return (
    <ScrollView
      ref={ref}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      onContentSizeChange={() => {
        if (!I18nManager.isRTL) ref.current?.scrollToEnd({ animated: false });
      }}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    direction: 'rtl',
    flexDirection: 'row',
  },
});
