import { Text } from 'react-native';

import { Screen } from '../../../shared/components/Screen';
import type { RootStackScreenProps } from '../../../navigation/types';

export function ReportDetailScreen({
  route,
}: RootStackScreenProps<'ReportDetail'>) {
  return (
    <Screen>
      <Text>Report detail {route.params.reportId}</Text>
    </Screen>
  );
}
