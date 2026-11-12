import { createContext, useContext, useEffect, useRef } from "react";
import type { AdminOrderEvent } from "@/types";

export type FeedStatus = "connecting" | "live" | "reconnecting" | "offline";

/** "resync": the connection was down, so events may have been missed; reload from NestJS. */
export type FeedMessage = { kind: "event"; event: AdminOrderEvent } | { kind: "resync" };

export interface AdminOrderFeed {
  status: FeedStatus;
  /** New orders that arrived while the orders page was not open. */
  unseenCount: number;
  subscribe: (listener: (message: FeedMessage) => void) => () => void;
  /** Registers an open orders page: clears the unseen count and pauses it until released. */
  attachOrdersPage: () => () => void;
}

export const AdminOrderFeedContext = createContext<AdminOrderFeed | null>(null);

export function useAdminOrderFeed(): AdminOrderFeed {
  const feed = useContext(AdminOrderFeedContext);
  if (!feed) throw new Error("useAdminOrderFeed must be used inside AdminOrderFeedProvider");
  return feed;
}

/** Delivers live order messages to the orders page while it is mounted. */
export function useOrdersPageFeed(onMessage: (message: FeedMessage) => void): FeedStatus {
  const { status, subscribe, attachOrdersPage } = useAdminOrderFeed();

  // Latest handler without re-subscribing on every render.
  const handler = useRef(onMessage);
  useEffect(() => {
    handler.current = onMessage;
  });

  useEffect(() => {
    const detach = attachOrdersPage();
    const unsubscribe = subscribe((message) => handler.current(message));
    return () => {
      unsubscribe();
      detach();
    };
  }, [subscribe, attachOrdersPage]);

  return status;
}
