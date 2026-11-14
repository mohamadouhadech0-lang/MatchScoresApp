import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { colors, radius, spacing } from '@/theme';
import { HapticPressable } from './HapticPressable';
import { Icon, type IconName } from './Icon';

export interface MenuAnchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MenuItem {
  key: string;
  label: string;
  icon: IconName;
  onPress: () => void;
  destructive?: boolean;
}

interface Props {
  /** Window coordinates of the button that opened the menu; `null` hides the menu. */
  anchor: MenuAnchor | null;
  items: MenuItem[];
  onClose: () => void;
}

const MENU_WIDTH = 230;
const ITEM_HEIGHT = 48;
const GAP = 6;
const EDGE = 12;

/**
 * Dark dropdown anchored to a button. Opens below the button (or above when there is no room),
 * aligned to the button's left edge in RTL and clamped to the screen.
 */
export function ContextMenu({ anchor, items, onClose }: Props) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const [progress] = useState(() => new Animated.Value(0));
  const [shown, setShown] = useState<MenuAnchor | null>(anchor);
  // Action chosen in the menu; runs after the menu's Modal is gone so another Modal
  // (e.g. a bottom sheet) can open safely on iOS.
  const pending = useRef<(() => void) | null>(null);

  // Keep the last anchor while the closing animation runs.
  if (anchor && anchor !== shown) setShown(anchor);

  useEffect(() => {
    if (!shown) return;
    Animated.timing(progress, {
      toValue: anchor ? 1 : 0,
      duration: anchor ? 150 : 110,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !anchor) {
        setShown(null);
        const action = pending.current;
        pending.current = null;
        if (action) setTimeout(action, 0);
      }
    });
  }, [anchor, shown, progress]);

  if (!shown) return null;

  const menuH = items.length * ITEM_HEIGHT + spacing.xs * 2;
  const below = shown.y + shown.height + GAP + menuH <= screenH - EDGE;
  const top = below ? shown.y + shown.height + GAP : shown.y - GAP - menuH;
  // The dots button sits on the left in RTL, so the menu grows rightwards from its left edge.
  const left = Math.min(Math.max(shown.x, EDGE), screenW - MENU_WIDTH - EDGE);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="إغلاق" />
      <Animated.View
        style={[
          styles.menu,
          {
            top,
            left,
            opacity: progress,
            transform: [{ scale }],
            transformOrigin: below ? 'top left' : 'bottom left',
          },
        ]}
        accessibilityRole="menu"
      >
        {items.map((item, i) => (
          <View key={item.key}>
            {i > 0 && <View style={styles.separator} />}
            <HapticPressable
              onPress={() => {
                pending.current = item.onPress;
                onClose();
              }}
              pressedOpacity={1}
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              accessibilityRole="menuitem"
            >
              <Icon name={item.icon} size="sm" color={item.destructive ? colors.live : colors.text} />
              <Text style={[styles.label, item.destructive && styles.destructive]} numberOfLines={1}>
                {item.label}
              </Text>
            </HapticPressable>
          </View>
        ))}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    width: MENU_WIDTH,
    direction: 'rtl',
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    // Shadow (iOS) / elevation (Android) so the menu floats above the cards.
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  item: {
    height: ITEM_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },
  itemPressed: {
    backgroundColor: colors.border,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.md,
    backgroundColor: colors.border,
  },
  label: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  destructive: {
    color: colors.live,
  },
});
