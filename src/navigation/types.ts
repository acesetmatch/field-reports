import type { NativeStackScreenProps } from '@react-navigation/native-stack';

/**
 * Single source of truth for route names and their params.
 *
 * Detail takes only a `reportId`, not the whole report. Route params end up in
 * navigation state (which can be serialised and restored), so they should stay
 * small and serialisable — the screen re-reads the full report from the query
 * cache / local store by id.
 */
export type RootStackParamList = {
  ReportList: undefined;
  ReportDetail: { reportId: number };
  CreateReport: undefined;
};

/** Props helper so screens get typed `route.params` and `navigation`. */
export type RootStackScreenProps<TRoute extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, TRoute>;

/**
 * Makes the param list the default for untyped `useNavigation()` calls, so
 * navigating with a bad route name or bad params is a compile error anywhere
 * in the app.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
