import { vi } from "vitest";

/** One query a test's code built: the table and each method called on it, in order. */
export interface FakeQuery {
  table: string;
  calls: { method: string; args: unknown[] }[];
}

export interface FakeResult {
  data?: unknown;
  error?: { message: string; code?: string } | null;
  /** For select(…, { count: "exact" }). */
  count?: number;
}

interface FakeOptions {
  /** The signed-in user, as getClaims reports it; null when signed out. */
  userId?: string | null;
  /** The answer to a query once it is awaited. Unanswered queries get { data: null }. */
  respond?: (query: FakeQuery) => FakeResult | undefined;
}

const WRITES = ["insert", "update", "upsert", "delete"];

/**
 * A stand-in Supabase client: every chain (from().select().eq()…) is recorded, and awaiting it
 * asks `respond` for the result. Enough to check what an action reads and, above all, whether it
 * writes.
 */
export function fakeSupabase({ userId = null, respond }: FakeOptions = {}) {
  const queries: FakeQuery[] = [];

  function from(table: string) {
    const query: FakeQuery = { table, calls: [] };
    queries.push(query);
    const chain: object = new Proxy(
      {},
      {
        get(_target, property) {
          if (property === "then") {
            const result = { data: null, error: null, ...respond?.(query) };
            return (resolve: (value: unknown) => void) => resolve(result);
          }
          return (...args: unknown[]) => {
            query.calls.push({ method: String(property), args });
            return chain;
          };
        },
      },
    );
    return chain;
  }

  const client = {
    from,
    rpc: vi.fn(async () => ({ data: null, error: null })),
    auth: {
      getClaims: vi.fn(async () => ({
        data: userId ? { claims: { sub: userId } } : null,
        error: null,
      })),
      signOut: vi.fn(async () => ({ error: null })),
      admin: { deleteUser: vi.fn(async () => ({ data: null, error: null })) },
    },
  };

  return {
    client,
    queries,
    /** Queries that changed data. */
    writes: () =>
      queries.filter((query) => query.calls.some((call) => WRITES.includes(call.method))),
  };
}

/** True when the query called `method`. */
export function called(query: FakeQuery, method: string): boolean {
  return query.calls.some((call) => call.method === method);
}

/** The arguments of the query's first call to `method`. */
export function argsOf(query: FakeQuery, method: string): unknown[] | undefined {
  return query.calls.find((call) => call.method === method)?.args;
}
