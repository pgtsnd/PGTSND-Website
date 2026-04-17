import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@workspace/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: async () => [
            {
              id: "s1",
              type: "google_drive",
              enabled: true,
              config: { accessToken: "test-token" },
            },
          ],
        }),
      }),
    }),
  },
  integrationSettingsTable: { type: "type", enabled: "enabled" },
}));

vi.mock("drizzle-orm", async () => {
  const actual = await vi.importActual<typeof import("drizzle-orm")>("drizzle-orm");
  return {
    ...actual,
    eq: (_col: any, val: any) => ({ __op: "eq", val }),
    and: (...args: any[]) => ({ __op: "and", args }),
  };
});

vi.mock("../services/vault", () => ({
  isVaultReady: () => false,
  decryptConfig: (c: any) => c,
}));

import {
  searchFolders,
  _clearDriveFolderCache,
} from "../services/google-drive";

interface FolderNode {
  id: string;
  name: string;
  parents?: string[];
}

function buildDeepTree(numLeaves: number, depth: number): {
  leaves: FolderNode[];
  all: Map<string, FolderNode>;
} {
  const all = new Map<string, FolderNode>();
  const leaves: FolderNode[] = [];
  for (let i = 0; i < numLeaves; i++) {
    let parentId: string | undefined = undefined;
    for (let d = 0; d < depth; d++) {
      const id = `f-${i}-d${d}`;
      const node: FolderNode = {
        id,
        name: `Folder-${i}-${d}`,
        parents: parentId ? [parentId] : undefined,
      };
      all.set(id, node);
      parentId = id;
    }
    const leafId = `leaf-${i}`;
    const leaf: FolderNode = {
      id: leafId,
      name: `Match ${i}`,
      parents: parentId ? [parentId] : undefined,
    };
    all.set(leafId, leaf);
    leaves.push(leaf);
  }
  return { leaves, all };
}

interface DriveFetchStub {
  fetchImpl: ReturnType<typeof vi.fn>;
  metadataCallCount: () => number;
  searchCallCount: () => number;
  peakConcurrency: () => number;
  waveCount: () => number;
}

function makeFetchStub(
  tree: Map<string, FolderNode>,
  searchResultsRef: { current: FolderNode[] },
  metadataDelayMs: number = 1,
): DriveFetchStub {
  let inflight = 0;
  let peak = 0;
  let waves = 0;
  let metaCalls = 0;
  let searchCalls = 0;

  const fetchImpl = vi.fn(async (input: string | URL | Request) => {
    const url = typeof input === "string" ? input : input.toString();

    const fileLookup = url.match(/\/drive\/v3\/files\/([^?]+)\?/);
    if (fileLookup) {
      metaCalls++;
      if (inflight === 0) waves++;
      inflight++;
      if (inflight > peak) peak = inflight;

      if (metadataDelayMs > 0) {
        await new Promise((r) => setTimeout(r, metadataDelayMs));
      }

      const id = decodeURIComponent(fileLookup[1]);
      const node = tree.get(id);
      inflight--;
      if (!node) return new Response("not found", { status: 404 });
      return new Response(
        JSON.stringify({ id: node.id, name: node.name, parents: node.parents }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }

    if (url.includes("/drive/v3/files?")) {
      searchCalls++;
      const files = searchResultsRef.current.map((l) => ({
        id: l.id,
        name: l.name,
        mimeType: "application/vnd.google-apps.folder",
        modifiedTime: "2026-01-01T00:00:00Z",
        webViewLink: `https://drive.google.com/${l.id}`,
        parents: l.parents,
      }));
      return new Response(JSON.stringify({ files }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }

    return new Response("unexpected", { status: 500 });
  });

  return {
    fetchImpl,
    metadataCallCount: () => metaCalls,
    searchCallCount: () => searchCalls,
    peakConcurrency: () => peak,
    waveCount: () => waves,
  };
}

describe("searchFolders performance", () => {
  beforeEach(() => {
    _clearDriveFolderCache();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("issues a bounded number of HTTP calls per depth (parallel batching) for 25 results across deep folders", async () => {
    const { leaves, all } = buildDeepTree(25, 4);
    const ref = { current: leaves };
    const stub = makeFetchStub(all, ref, 2);
    vi.stubGlobal("fetch", stub.fetchImpl);

    const results = await searchFolders("Match", 25);

    expect(results).toHaveLength(25);
    expect(stub.searchCallCount()).toBe(1);

    // 25 leaves × 4 ancestor levels = 100 unique parent metadata fetches.
    expect(stub.metadataCallCount()).toBe(100);

    // Parallel batching: peak in-flight reaches 25 (the full level width),
    // not 1 (which would be the old serial walk).
    expect(stub.peakConcurrency()).toBe(25);

    // Exactly one wave per depth level — confirms depth-by-depth batching
    // rather than a single flat fan-out (which would be 1 wave) or a
    // per-folder serial walk (which would be 100 waves).
    expect(stub.waveCount()).toBe(4);

    // Each result should have a fully resolved 4-segment ancestor path.
    for (const r of results) {
      expect(r.parentPath.startsWith("My Drive / ")).toBe(true);
      expect(r.parentPath.split(" / ")).toHaveLength(5);
    }
  });

  it("reuses cached parent metadata on a second search and skips redundant API calls", async () => {
    const { leaves, all } = buildDeepTree(5, 3);
    const ref = { current: leaves };
    const stub = makeFetchStub(all, ref, 0);
    vi.stubGlobal("fetch", stub.fetchImpl);

    await searchFolders("Match", 25);
    const firstMeta = stub.metadataCallCount();
    expect(firstMeta).toBe(15); // 5 × 3 unique parents

    await searchFolders("Match", 25);
    // Second call hits the cache for every parent — zero new metadata fetches.
    expect(stub.metadataCallCount()).toBe(firstMeta);
    // The search query itself is not cached and runs again.
    expect(stub.searchCallCount()).toBe(2);
  });

  it("respects the in-memory folder cache TTL and refetches expired entries", async () => {
    const { leaves, all } = buildDeepTree(2, 2);
    const ref = { current: leaves };
    const stub = makeFetchStub(all, ref, 0);
    vi.stubGlobal("fetch", stub.fetchImpl);

    let now = 1_700_000_000_000;
    vi.spyOn(Date, "now").mockImplementation(() => now);

    await searchFolders("Match", 25);
    const initial = stub.metadataCallCount();
    expect(initial).toBe(4); // 2 × 2 unique parents

    // Within TTL — second search should be fully cached.
    now += 60_000;
    await searchFolders("Match", 25);
    expect(stub.metadataCallCount()).toBe(initial);

    // Step past the 5-minute TTL.
    now += 5 * 60 * 1000 + 1;
    await searchFolders("Match", 25);
    expect(stub.metadataCallCount()).toBe(initial * 2);
  });

  it("evicts oldest entries when the in-memory cache exceeds its max size", async () => {
    const FOLDER_CACHE_MAX = 5000;
    const PER_BATCH = 50;

    const all = new Map<string, FolderNode>();
    function makeLeavesForParents(parentStart: number, count: number, prefix: string): FolderNode[] {
      const batch: FolderNode[] = [];
      for (let i = 0; i < count; i++) {
        const parentId = `p-${parentStart + i}`;
        if (!all.has(parentId)) {
          all.set(parentId, { id: parentId, name: `P${parentStart + i}` });
        }
        const leafId = `${prefix}-${parentStart + i}`;
        const leaf: FolderNode = { id: leafId, name: "Match", parents: [parentId] };
        all.set(leafId, leaf);
        batch.push(leaf);
      }
      return batch;
    }

    const ref = { current: [] as FolderNode[] };
    const stub = makeFetchStub(all, ref, 0);
    vi.stubGlobal("fetch", stub.fetchImpl);

    // Fill the cache exactly to FOLDER_CACHE_MAX with unique parents
    // p-0 .. p-4999 (one per leaf, 100 batches of 50).
    const batchesToFill = FOLDER_CACHE_MAX / PER_BATCH;
    for (let b = 0; b < batchesToFill; b++) {
      ref.current = makeLeavesForParents(b * PER_BATCH, PER_BATCH, "lf");
      await searchFolders("Match", PER_BATCH);
    }
    expect(stub.metadataCallCount()).toBe(FOLDER_CACHE_MAX);

    // Add 50 brand-new parents — this triggers FIFO eviction of p-0..p-49.
    ref.current = makeLeavesForParents(FOLDER_CACHE_MAX, PER_BATCH, "ov");
    await searchFolders("Match", PER_BATCH);
    expect(stub.metadataCallCount()).toBe(FOLDER_CACHE_MAX + PER_BATCH);

    // Re-search the originally-evicted parents (p-0..p-49) using fresh
    // leaf ids so the search isn't short-circuited by leaf identity.
    ref.current = makeLeavesForParents(0, PER_BATCH, "rf");
    const before = stub.metadataCallCount();
    await searchFolders("Match", PER_BATCH);
    // All 50 parents must be refetched because they were evicted.
    expect(stub.metadataCallCount() - before).toBe(PER_BATCH);
  });
});
