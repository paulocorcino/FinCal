import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockUserFindUnique, mockBcryptCompare } = vi.hoisted(() => ({
  mockUserFindUnique: vi.fn(),
  mockBcryptCompare: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => mockUserFindUnique(...args) },
  },
}));

vi.mock("bcryptjs", () => ({
  default: { compare: (...args: unknown[]) => mockBcryptCompare(...args) },
}));

vi.mock("next-auth", () => ({
  default: () => ({
    handlers: { GET: vi.fn(), POST: vi.fn() },
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: () => ({}),
}));

vi.mock("next-auth/providers/credentials", () => ({
  default: (config: unknown) => ({ type: "credentials", ...(config as object) }),
}));

import { authorize } from "@/auth";

describe("authorize (Credentials provider)", () => {
  beforeEach(() => {
    mockUserFindUnique.mockReset();
    mockBcryptCompare.mockReset();
  });

  it("returns {id,name,email} for valid credentials", async () => {
    mockUserFindUnique.mockResolvedValueOnce({
      id: "u1",
      name: "Alice",
      email: "alice@x.com",
      passwordHash: "$2b$REAL",
    });
    mockBcryptCompare.mockResolvedValueOnce(true);

    const result = await authorize({ email: "alice@x.com", password: "senha123" });

    expect(result).toEqual({ id: "u1", name: "Alice", email: "alice@x.com" });
    expect(mockUserFindUnique).toHaveBeenCalledWith({
      where: { email: "alice@x.com" },
    });
    expect(mockBcryptCompare).toHaveBeenCalledWith("senha123", "$2b$REAL");
  });

  it("returns null for missing user AND still runs bcrypt.compare (timing-safe DUMMY_HASH fallback)", async () => {
    mockUserFindUnique.mockResolvedValueOnce(null);
    mockBcryptCompare.mockResolvedValueOnce(false);

    const result = await authorize({ email: "nobody@x.com", password: "x" });

    expect(result).toBeNull();
    expect(mockBcryptCompare).toHaveBeenCalledTimes(1);
    const compareArgs = mockBcryptCompare.mock.calls[0];
    expect(compareArgs[0]).toBe("x");
    expect(typeof compareArgs[1]).toBe("string");
    expect(compareArgs[1].length).toBeGreaterThan(0);
  });

  it("returns null when user exists but password is wrong", async () => {
    mockUserFindUnique.mockResolvedValueOnce({
      id: "u1",
      name: "Alice",
      email: "alice@x.com",
      passwordHash: "$2b$REAL",
    });
    mockBcryptCompare.mockResolvedValueOnce(false);

    const result = await authorize({ email: "alice@x.com", password: "wrong" });

    expect(result).toBeNull();
  });
});
