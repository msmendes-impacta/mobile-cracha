import { StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme/useTheme';

/** Bar widths in dp: a fixed, decorative pattern (it encodes nothing, design-shape §4). */
const PATTERN = [2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 1, 3, 2, 1, 2, 1, 3, 1, 1, 2, 2, 1, 3, 1, 2];

/** Decorative barcode at the foot of the login badge. Hidden from screen readers. */
export function Barcode({ height = 32 }: { height?: number }) {
  const { colors } = useTheme();
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[styles.row, { height }]}
    >
      {PATTERN.map((width, index) => (
        <View
          key={index}
          style={{
            width,
            height: '100%',
            marginRight: 2,
            backgroundColor: index % 2 === 0 ? colors.onSurface : 'transparent',
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignSelf: 'center' },
});
