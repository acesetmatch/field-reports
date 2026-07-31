import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

import { CreateReportScreen } from '../features/reports/screens/CreateReportScreen';
import { ReportDetailScreen } from '../features/reports/screens/ReportDetailScreen';
import { ReportListScreen } from '../features/reports/screens/ReportListScreen';
import { MIN_TOUCH_TARGET, colors, typography } from '../shared/theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * A single native stack. `createNativeStackNavigator` maps to
 * UINavigationController / Fragment transitions, so gestures and header
 * animations are the platform's rather than re-implemented in JS.
 */
export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTitleStyle: { color: colors.text },
          headerTintColor: colors.primary,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="ReportList"
          component={ReportListScreen}
          options={({ navigation }) => ({
            title: 'Field Reports',
            headerRight: () => (
              <Pressable
                onPress={() => navigation.navigate('CreateReport')}
                accessibilityRole="button"
                accessibilityLabel="Create a new report"
                hitSlop={12}
                style={({ pressed }) => [styles.action, pressed && styles.pressed]}
              >
                <Text style={styles.actionText}>New</Text>
              </Pressable>
            ),
          })}
        />
        <Stack.Screen
          name="ReportDetail"
          component={ReportDetailScreen}
          options={{ title: 'Report' }}
        />
        <Stack.Screen
          name="CreateReport"
          component={CreateReportScreen}
          options={{
            title: 'New Report',
            // A modal reads as "a task you can abandon", which fits a create
            // form better than a push. `formSheet` is iOS-only; Android gets
            // the standard push, which is the platform-idiomatic equivalent.
            presentation: Platform.OS === 'ios' ? 'modal' : 'card',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  action: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  actionText: {
    ...typography.heading,
    color: colors.primary,
  },
});
