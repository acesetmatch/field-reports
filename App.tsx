import { QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LocalReportsProvider } from './src/features/reports/store/localReportsStore';
import { createQueryClient } from './src/shared/queryClient';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  // Created in state rather than at module scope so the client is tied to the
  // component tree — one instance per app, but not a module-level singleton
  // that would leak cached data between test renders.
  const [queryClient] = useState(createQueryClient);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <LocalReportsProvider>
          <StatusBar style="dark" />
          <RootNavigator />
        </LocalReportsProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
