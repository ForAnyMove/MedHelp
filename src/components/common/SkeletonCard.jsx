import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';
import { useStyles } from '../../theme/useStyles';

/**
 * Animated loading skeleton card.
 * Renders a pulsing placeholder that matches the shape of a content card.
 *
 * Props:
 *   lines    {number}  — number of text-line placeholders (default: 2)
 *   height   {number}  — optional fixed height override
 */
export function SkeletonCard({ lines = 2, height }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  const styles = useStyles(themeStyles);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.card, height ? { height } : null, { opacity }]}>
      {/* Avatar/icon placeholder */}
      <View style={styles.avatar} />
      {/* Text lines */}
      <View style={styles.textArea}>
        <View style={[styles.line, styles.lineWide]} />
        {Array.from({ length: lines - 1 }).map((_, i) => (
          <View key={i} style={[styles.line, i % 2 === 0 ? styles.lineMed : styles.lineShort]} />
        ))}
      </View>
    </Animated.View>
  );
}

const themeStyles = (theme) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.sizes.borderRadius.large,
    padding: theme.sizes.spacing.l,
    marginBottom: theme.sizes.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.n200,
    marginRight: theme.sizes.spacing.m,
  },
  textArea: {
    flex: 1,
    gap: theme.sizes.spacing.s,
  },
  line: {
    height: 12,
    backgroundColor: theme.colors.n200,
    borderRadius: 6,
  },
  lineWide: { width: '80%' },
  lineMed: { width: '60%' },
  lineShort: { width: '40%' },
});
