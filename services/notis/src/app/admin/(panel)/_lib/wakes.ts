import { WakeOutcome } from "@/agent/types";
import { hasNotisDb, notisDb } from "@/lib/db";

/** The cross-user wake feed. Empty without NOTIS_DATABASE_URL. */

export type DecisionFilter = "all" | "send" | "silence" | "error";

export function parseDecisionFilter(value: string | undefined): DecisionFilter {
  return value === "send" || value === "silence" || value === "error" ? value : "all";
}

export interface WakeFeedEntry {
  id: string;
  at: string;
  userName: string;
  conversationId: string;
  eventType: string;
  decision: "send" | "silence" | "error";
  rationale: string;
  messageCount: number;
  /** Health marks: repair nudges fired, token-ceiling cut, missing finish. */
  repairs: number;
  truncated: boolean;
  finishWakeMissing: boolean;
  costUsd: number;
  durationMs: number;
}

export interface WakeFeed {
  entries: WakeFeedEntry[];
  /** Decision counts over the same window, for the filter chips. */
  counts: Record<"all" | "send" | "silence" | "error", number>;
}

const FEED_LIMIT = 200;

export async function listRecentWakes(filter: DecisionFilter = "all"): Promise<WakeFeed> {
  if (!hasNotisDb()) {
    return { entries: [], counts: { all: 0, send: 0, silence: 0, error: 0 } };
  }
  const db = notisDb();
  const [wakes, decisionCounts] = await Promise.all([
    db.notisWake.findMany({
      where: filter === "all" ? undefined : { decision: filter },
      orderBy: { createdAt: "desc" },
      take: FEED_LIMIT,
      include: { subscription: { select: { userName: true } } },
    }),
    db.notisWake.groupBy({ by: ["decision"], _count: { _all: true } }),
  ]);

  const count = (d: string) =>
    decisionCounts.find((r) => r.decision === d)?._count._all ?? 0;
  return {
    entries: wakes.map((wake) => ({
      id: wake.id,
      at: wake.eventAt.toISOString(),
      userName: wake.subscription.userName ?? "—",
      conversationId: wake.subscriptionId,
      eventType: wake.eventType,
      decision: wake.decision,
      rationale: wake.rationale,
      messageCount: (wake.outcome as unknown as WakeOutcome).messages.length,
      repairs: wake.repairs.length,
      truncated: wake.truncated,
      finishWakeMissing: wake.finishWakeMissing,
      costUsd: wake.costUsd,
      durationMs: wake.durationMs,
    })),
    counts: {
      all: count("send") + count("silence") + count("error"),
      send: count("send"),
      silence: count("silence"),
      error: count("error"),
    },
  };
}
