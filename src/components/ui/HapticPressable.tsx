import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { haptics } from '@/utils/haptics';

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
  /** 'tap' (default) for icons/list items, 'impact' for primary actions, 'none' to skip. */
  feedback?: 'tap' | 'impact' | 'none';
  /** Opacity while pressed. */
  pressedOpacity?: number;
};

/** Pressable with haptic feedback and a consistent pressed state, used for every touch target. */
export function HapticPressable({ onPress, feedback = 'tap', pressedOpacity = 0.7, style, disabled, ...rest }: Props) {
  return (
    <Pressable
      disabled={disabled}
      onPress={(e) => {
        if (feedback !== 'none') haptics[feedback]();
        onPress?.(e);
      }}
      style={(state) => [
        typeof style === 'function' ? style(state) : style,
        state.pressed && { opacity: pressedOpacity },
        disabled && { opacity: 0.5 },
      ]}
      {...rest}
    />
  );
}
