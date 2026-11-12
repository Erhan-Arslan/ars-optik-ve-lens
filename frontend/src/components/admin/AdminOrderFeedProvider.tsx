import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { getFreshAccessToken } from "@/lib/api";
import { AdminOrderFeedContext, type AdminOrderFeed, type FeedMessage, type FeedStatus } from "@/hooks/useAdminOrderFeed";
import type { AdminOrderEvent } from "@/types";

const HUB_URL = `${import.meta.env.VITE_DOTNET_API_URL ?? "http://localhost:5000"}/hubs/admin-orders`;
// The free Render instance may need ~50 s to wake up; keep retrying at a gentle pace.
const RESTART_DELAY_MS = 15_000;

/**
 * One SignalR connection for the whole admin panel. The .NET service relays the order events
 * NestJS publishes; this is purely a live overlay — pages still load their data from NestJS.
 */
export function AdminOrderFeedProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<FeedStatus>("connecting");
  const [unseenCount, setUnseenCount] = useState(0);
  const listeners = useRef(new Set<(message: FeedMessage) => void>());
  const openOrdersPages = useRef(0);

  const emit = useCallback((message: FeedMessage) => {
    listeners.current.forEach((listener) => listener(message));
  }, []);

  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: async () => (await getFreshAccessToken()) ?? "" })
      .withAutomaticReconnect([0, 2_000, 5_000, 10_000, 30_000])
      .configureLogging(LogLevel.None)
      .build();

    let disposed = false;
    let restartTimer: number | undefined;

    const scheduleStart = () => {
      window.clearTimeout(restartTimer);
      restartTimer = window.setTimeout(() => void start(), RESTART_DELAY_MS);
    };

    const start = async () => {
      if (disposed || connection.state !== HubConnectionState.Disconnected) return;
      try {
        await connection.start();
        if (disposed) return;
        setStatus("live");
        emit({ kind: "resync" });
      } catch {
        if (disposed) return;
        setStatus("offline");
        scheduleStart();
      }
    };

    connection.on("orderEvent", (event: AdminOrderEvent) => {
      if (event.type === "order.created" && openOrdersPages.current === 0) {
        setUnseenCount((count) => count + 1);
      }
      emit({ kind: "event", event });
    });
    connection.onreconnecting(() => setStatus("reconnecting"));
    connection.onreconnected(() => {
      setStatus("live");
      emit({ kind: "resync" });
    });
    // Automatic reconnect gave up, or the server closed the connection (e.g. token expired).
    connection.onclose(() => {
      if (disposed) return;
      setStatus("offline");
      scheduleStart();
    });

    void start();

    return () => {
      disposed = true;
      window.clearTimeout(restartTimer);
      void connection.stop();
    };
  }, [emit]);

  const subscribe = useCallback((listener: (message: FeedMessage) => void) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  const attachOrdersPage = useCallback(() => {
    openOrdersPages.current += 1;
    setUnseenCount(0);
    return () => {
      openOrdersPages.current -= 1;
    };
  }, []);

  const value = useMemo<AdminOrderFeed>(
    () => ({ status, unseenCount, subscribe, attachOrdersPage }),
    [status, unseenCount, subscribe, attachOrdersPage],
  );

  return <AdminOrderFeedContext.Provider value={value}>{children}</AdminOrderFeedContext.Provider>;
}
