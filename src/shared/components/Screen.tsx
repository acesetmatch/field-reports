import { StyleSheet, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../theme';

type ScreenProps = ViewProps & {
  /**
   * Screens pushed onto the stack get a header, so they only need bottom
   * inset padding. Set to `false` when the content scrolls edge to edge.
   */
  padded?: boolean;
};

/**
 * Common screen wrapper: background colour plus bottom safe-area inset.
 *
 * Top inset is handled by the native stack header, so applying it here too
 * would double the gap.
 */
export function Screen({ padded = true, style, ...rest }: ScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.root,
        { paddingBottom: insets.bottom },
        padded && styles.padded,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  padded: {
    paddingHorizontal: spacing.lg,
  },
});
