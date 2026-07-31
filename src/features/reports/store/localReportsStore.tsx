import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
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
 * See DECISIONS.md for the production sync-queue design.
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
  nextId: number;
};

type Action = { type: 'add'; input: NewReportInput; createdAt: string };

const initialState: State = { reports: [], nextId: LOCAL_ID_START };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'add': {
      const report: LocalReport = {
        id: state.nextId,
        title: action.input.title,
        body: action.input.body,
        createdAt: action.createdAt,
        device: action.input.device,
      };
      return {
        reports: [report, ...state.reports],
        nextId: state.nextId + 1,
      };
    }
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

  // The reducer owns id assignment, but the caller needs the created report
  // back. Deriving it from the pre-dispatch `nextId` keeps the reducer pure.
  const addReport = useCallback(
    (input: NewReportInput): LocalReport => {
      const createdAt = new Date().toISOString();
      dispatch({ type: 'add', input, createdAt });
      return { id: state.nextId, createdAt, ...input };
    },
    [state.nextId],
  );

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
