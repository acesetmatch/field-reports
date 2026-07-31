import { StyleSheet, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme';

/**
 * Common screen wrapper: background colour plus bottom safe-area inset.
 *
 * Top inset is handled by the native stack header, so applying it here too
 * would double the gap. Horizontal padding is each screen's job — scrolling
 * screens pad their content container so the scrollbar stays edge to edge.
 */
export function Screen({ style, ...rest }: ViewProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.root, { paddingBottom: insets.bottom }, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
