import { memo, useState, type ReactNode } from 'react';
import { Image, StyleSheet, View, type ImageLoadEvent } from 'react-native';

import { colors } from '@/theme';

/**
 * How an image should sit inside its circle:
 * - `flag`:  edge-to-edge (cover). API-Football national-team logos are 150×150 PNGs with the
 *            3:2 flag letter-boxed in the middle (rows 24–123 transparent above/below), so square
 *            sources are scaled ×1.5 to crop those transparent bands away.
 * - `crest`: club / league crests keep their whole shape (contain), centered on a dark disc.
 * - `photo`: portraits, edge-to-edge (cover).
 */
export type LogoVariant = 'flag' | 'crest' | 'photo';

/** Share of a square API flag image that is actual flag (100 of 150 px). */
const LETTERBOX_SCALE = 1.5;
/** Crest size relative to the circle, so crests never touch the edge. */
const CREST_INSET = 0.74;

interface Props {
  uri?: string;
  size: number;
  variant: LogoVariant;
  /** Rendered when there is no image or it fails to load. */
  fallback: ReactNode;
  fallbackColor?: string;
}

function CircleLogoBase({ uri, size, variant, fallback, fallbackColor }: Props) {
  const [failed, setFailed] = useState(false);
  // Assume API-Football flags are square/letter-boxed until the real size is known.
  const [square, setSquare] = useState(() => !!uri && uri.includes('media.api-sports.io'));
  const circle = { width: size, height: size, borderRadius: size / 2 };
  const showImage = !!uri && !failed;

  const onLoad = (e: ImageLoadEvent) => {
    const { width, height } = e.nativeEvent.source;
    if (width && height) setSquare(Math.abs(width / height - 1) < 0.05);
  };

  let image: ReactNode = null;
  if (showImage) {
    if (variant === 'crest') {
      const inner = size * CREST_INSET;
      image = (
        <Image
          source={{ uri }}
          style={{ width: inner, height: inner }}
          resizeMode="contain"
          onError={() => setFailed(true)}
          accessibilityIgnoresInvertColors
        />
      );
    } else if (variant === 'flag' && square) {
      const big = size * LETTERBOX_SCALE;
      const offset = (size - big) / 2;
      image = (
        <Image
          source={{ uri }}
          style={{ position: 'absolute', width: big, height: big, top: offset, left: offset }}
          resizeMode="cover"
          onLoad={onLoad}
          onError={() => setFailed(true)}
          accessibilityIgnoresInvertColors
        />
      );
    } else {
      image = (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onLoad={variant === 'flag' ? onLoad : undefined}
          onError={() => setFailed(true)}
          accessibilityIgnoresInvertColors
        />
      );
    }
  }

  return (
    <View
      style={[
        styles.circle,
        circle,
        {
          backgroundColor: showImage
            ? variant === 'crest'
              ? colors.surfaceElevated
              : colors.capsule
            : (fallbackColor ?? colors.surfaceElevated),
        },
      ]}
    >
      {showImage ? image : fallback}
      {/* Hairline ring drawn on top so the image reaches the very edge of the circle. */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.ring, { borderRadius: size / 2 }]} />
    </View>
  );
}

export const CircleLogo = memo(CircleLogoBase);

const styles = StyleSheet.create({
  circle: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: 'rgba(255,255,255,0.14)',
  },
});
