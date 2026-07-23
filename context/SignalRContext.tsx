"use client";

import {
  HubConnection,
  HubConnectionState,
} from "@microsoft/signalr";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type {
  ClientSyncPayload,
  LeaderboardSnapshot,
  OperationResult,
  PlayerScorecard,
  SubmitScoreRequest,
} from "@/models/tournament";
import {
  createTournamentHubConnection,
  mapHubState,
} from "@/services/signalr/connection";
import type { SignalRConnectionState } from "@/services/signalr/events";
import {
  attachTournamentHubHandlers,
  registerLeaderboardViewer as hubRegisterLeaderboard,
  registerScoringClient as hubRegisterScoring,
  submitScore as hubSubmitScore,
} from "@/services/signalr/tournamentHub";

interface SignalRContextValue {
  connectionState: SignalRConnectionState;
  lastError: string | null;
  syncPayload: ClientSyncPayload | null;
  scorecard: PlayerScorecard | null;
  leaderboards: LeaderboardSnapshot[];
  ensureConnected: () => Promise<HubConnection>;
  registerScoringClient: (playerUuid: string) => Promise<OperationResult>;
  registerLeaderboardViewer: () => Promise<void>;
  submitScore: (request: SubmitScoreRequest) => Promise<OperationResult>;
  clearSync: () => void;
}

const SignalRContext = createContext<SignalRContextValue | null>(null);

export function SignalRProvider({ children }: { children: ReactNode }) {
  const connectionRef = useRef<HubConnection | null>(null);
  const [connectionState, setConnectionState] =
    useState<SignalRConnectionState>("disconnected");
  const [lastError, setLastError] = useState<string | null>(null);
  const [syncPayload, setSyncPayload] = useState<ClientSyncPayload | null>(
    null,
  );
  const [scorecard, setScorecard] = useState<PlayerScorecard | null>(null);
  const [leaderboards, setLeaderboards] = useState<LeaderboardSnapshot[]>([]);

  const applySync = useCallback((payload: ClientSyncPayload) => {
    setSyncPayload(payload);
    setScorecard(payload.scorecard);
    setLeaderboards(payload.leaderboards ?? []);
  }, []);

  const ensureConnected = useCallback(async () => {
    if (
      connectionRef.current &&
      connectionRef.current.state === HubConnectionState.Connected
    ) {
      return connectionRef.current;
    }

    if (!connectionRef.current) {
      const connection = createTournamentHubConnection();
      connectionRef.current = connection;

      attachTournamentHubHandlers(connection, {
        onSyncState: applySync,
        onScorecardUpdated: setScorecard,
        onLeaderboardUpdated: (snapshot) => {
          setLeaderboards((prev) => {
            const others = prev.filter((s) => s.category !== snapshot.category);
            return [...others, snapshot].sort((a, b) => a.category - b.category);
          });
        },
      });

      connection.onreconnecting(() => {
        setConnectionState("reconnecting");
      });
      connection.onreconnected(() => {
        setConnectionState("connected");
        setLastError(null);
      });
      connection.onclose(() => {
        setConnectionState("disconnected");
      });
    }

    const connection = connectionRef.current;
    if (connection.state === HubConnectionState.Disconnected) {
      setConnectionState("connecting");
      try {
        await connection.start();
        setConnectionState("connected");
        setLastError(null);
      } catch (error) {
        setConnectionState("failed");
        const message =
          error instanceof Error ? error.message : "Failed to connect";
        setLastError(message);
        throw error;
      }
    }

    setConnectionState(mapHubState(connection.state) as SignalRConnectionState);
    return connection;
  }, [applySync]);

  useEffect(() => {
    return () => {
      void connectionRef.current?.stop();
      connectionRef.current = null;
    };
  }, []);

  const registerScoringClient = useCallback(
    async (playerUuid: string) => {
      const connection = await ensureConnected();
      const result = await hubRegisterScoring(connection, playerUuid);
      if (!result.success) {
        setLastError(result.error ?? "Registration failed");
      }
      return result;
    },
    [ensureConnected],
  );

  const registerLeaderboardViewer = useCallback(async () => {
    const connection = await ensureConnected();
    await hubRegisterLeaderboard(connection);
  }, [ensureConnected]);

  const submitScore = useCallback(
    async (request: SubmitScoreRequest) => {
      const connection = await ensureConnected();
      const result = await hubSubmitScore(connection, request);
      if (!result.success) {
        setLastError(result.error ?? "Score submit failed");
      }
      return result;
    },
    [ensureConnected],
  );

  const clearSync = useCallback(() => {
    setSyncPayload(null);
    setScorecard(null);
  }, []);

  const value = useMemo(
    () => ({
      connectionState,
      lastError,
      syncPayload,
      scorecard,
      leaderboards,
      ensureConnected,
      registerScoringClient,
      registerLeaderboardViewer,
      submitScore,
      clearSync,
    }),
    [
      connectionState,
      lastError,
      syncPayload,
      scorecard,
      leaderboards,
      ensureConnected,
      registerScoringClient,
      registerLeaderboardViewer,
      submitScore,
      clearSync,
    ],
  );

  return (
    <SignalRContext.Provider value={value}>{children}</SignalRContext.Provider>
  );
}

export function useSignalR() {
  const ctx = useContext(SignalRContext);
  if (!ctx) {
    throw new Error("useSignalR must be used within SignalRProvider");
  }
  return ctx;
}
