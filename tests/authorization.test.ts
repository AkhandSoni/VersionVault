import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError, NotFoundError } from "../src/lib/errors";

type Row = Record<string, string | null>;
type TableName = "documents" | "memberships" | "collaborators";
type Database = Record<TableName, Row[]>;

const mockDb = vi.hoisted<Database>(() => ({
  documents: [],
  memberships: [],
  collaborators: [],
}));

class QueryBuilder {
  private filters: Array<[string, string]> = [];

  constructor(private readonly rows: Row[]) {}

  select() {
    return this;
  }

  eq(column: string, value: string) {
    this.filters.push([column, value]);
    return this;
  }

  async single() {
    const row = this.rows.find((candidate) =>
      this.filters.every(([column, value]) => candidate[column] === value),
    );

    return row ? { data: row, error: null } : { data: null, error: { message: "No rows" } };
  }
}

vi.mock("@/lib/supabase/server", () => ({
  createServiceClient: async () => ({
    from: (tableName: TableName) => new QueryBuilder(mockDb[tableName]),
  }),
}));

describe("Authorization service guards", () => {
  beforeEach(() => {
    mockDb.documents = [
      {
        id: "doc_1",
        tenant_id: "tenant_1",
        title: "Vendor Agreement",
        current_version_id: "ver_2",
        default_branch_id: "branch_main",
        created_by: "owner_1",
        created_at: "2026-08-30T00:00:00.000Z",
        updated_at: "2026-08-30T00:00:00.000Z",
      },
    ];
    mockDb.memberships = [];
    mockDb.collaborators = [];
  });

  it("allows owners and contributors to edit documents", async () => {
    const { assertDocumentCanEdit } = await import("../src/services/authorization.service");

    mockDb.memberships = [
      { id: "mem_owner", tenant_id: "tenant_1", user_id: "owner_1", role: "OWNER" },
      { id: "mem_contributor", tenant_id: "tenant_1", user_id: "contributor_1", role: "CONTRIBUTOR" },
    ];

    await expect(assertDocumentCanEdit("owner_1", "doc_1")).resolves.toMatchObject({
      membershipRole: "OWNER",
    });
    await expect(assertDocumentCanEdit("contributor_1", "doc_1")).resolves.toMatchObject({
      membershipRole: "CONTRIBUTOR",
    });
  });

  it("blocks viewers from editing documents", async () => {
    const { assertDocumentCanEdit } = await import("../src/services/authorization.service");

    mockDb.memberships = [
      { id: "mem_viewer", tenant_id: "tenant_1", user_id: "viewer_1", role: "VIEWER" },
    ];

    await expect(assertDocumentCanEdit("viewer_1", "doc_1")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("blocks contributors from managing collaborators", async () => {
    const { assertDocumentOwner } = await import("../src/services/authorization.service");

    mockDb.memberships = [
      { id: "mem_contributor", tenant_id: "tenant_1", user_id: "contributor_1", role: "CONTRIBUTOR" },
    ];

    await expect(assertDocumentOwner("contributor_1", "doc_1")).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("hides documents from unrelated users", async () => {
    const { assertDocumentCanRead } = await import("../src/services/authorization.service");

    await expect(assertDocumentCanRead("stranger_1", "doc_1")).rejects.toBeInstanceOf(NotFoundError);
  });
});
