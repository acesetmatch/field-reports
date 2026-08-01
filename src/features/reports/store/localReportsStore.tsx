import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react';

import type { DeviceSnapshot } from '../../device/types';
import type { LocalReport } from '../types';

/**
 * Reports created on this device.
 *
 * Client-owned state, so it lives in a reducer rather than the query cache —
 * a background refetch of the server list must never be able to drop it.
 *
 * In-memory only: the brief allows local state, and persistence would add a
 * rehydration loading state and a merge-order question for no graded benefit.
 * The production sync-queue design is in README's "What I would improve".
 */

/**
 * jsonplaceholder ids run 1–100. Starting above that keeps locally-created
 * reports collision-free without needing UUIDs, which would complicate the
 * `{ reportId: number }` route param.
 */
const LOCAL_ID_START = 1001;

export type NewReportInput = {
  title: string;
  body: string;
  device?: DeviceSnapshot;
};

type State = {
  /** Newest first, so the list can render them straight above remote reports. */
  reports: LocalReport[];
};

/**
 * The fully-formed report is built before dispatch, so the reducer only
 * appends. See `addReport` for why the id is not assigned here.
 */
type Action = { type: 'add'; report: LocalReport };

const initialState: State = { reports: [] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'add':
      return { reports: [action.report, ...state.reports] };
  }
}

type LocalReportsContextValue = {
  localReports: LocalReport[];
  /** Returns the created report so the caller can navigate to it. */
  addReport: (input: NewReportInput) => LocalReport;
};

const LocalReportsContext = createContext<LocalReportsContextValue | null>(null);

export function LocalReportsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Ids come from a ref, not from reducer state, because the caller needs the
  // created report back synchronously in order to navigate to it. Reading the
  // next id from state would mean reading a value from a closure captured on
  // the last render: two calls in the same render cycle would both be handed
  // the same id while the reducer assigned two different ones, and the caller
  // would navigate to the wrong report. A ref increments eagerly, so the id
  // returned is always the id stored.
  const nextIdRef = useRef(LOCAL_ID_START);

  const addReport = useCallback((input: NewReportInput): LocalReport => {
    const report: LocalReport = {
      id: nextIdRef.current++,
      title: input.title,
      body: input.body,
      createdAt: new Date().toISOString(),
      device: input.device,
    };

    dispatch({ type: 'add', report });

    return report;
  }, []);

  const value = useMemo(
    () => ({ localReports: state.reports, addReport }),
    [state.reports, addReport],
  );

  return (
    <LocalReportsContext.Provider value={value}>
      {children}
    </LocalReportsContext.Provider>
  );
}

export function useLocalReports(): LocalReportsContextValue {
  const value = useContext(LocalReportsContext);
  if (!value) {
    throw new Error('useLocalReports must be used within a LocalReportsProvider');
  }
  return value;
}
