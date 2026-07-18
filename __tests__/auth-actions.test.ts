import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockSignIn, mockSignOut, mockHash, mockUserCreate, mockUserFindUnique, mockTransaction } =
  vi.hoisted(() => ({
    mockSignIn: vi.fn().mockResolvedValue(undefined),
    mockSignOut: vi.fn().mockResolvedValue(undefined),
    mockHash: vi.fn().mockResolvedValue("$2b$HASH"),
    mockUserCreate: vi.fn().mockResolvedValue({ id: "u1" }),
    mockUserFindUnique: vi.fn(),
    mockTransaction: vi.fn(
      async (cb: (tx: unknown) => Promise<unknown>) => cb({})
    ),
  }));

vi.mock("@/auth", () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

vi.mock("next-auth", () => ({
  AuthError: class AuthError extends Error {
    name = "AuthError";
  },
}));

vi.mock("bcryptjs", () => ({
  default: { hash: (...args: unknown[]) => mockHash(...args) },
}));

vi.mock("@/lib/prisma", () => {
  return {
    prisma: {
      user: { findUnique: (...args: unknown[]) => mockUserFindUnique(...args) },
      $transaction: (cb: (tx: unknown) => Promise<unknown>) =>
        mockTransaction(cb),
    },
  };
});

import { login, register, logout } from "@/lib/auth-actions";

describe("auth-actions", () => {
  beforeEach(() => {
    mockSignIn.mockClear();
    mockSignOut.mockClear();
    mockHash.mockClear();
    mockUserCreate.mockClear();
    mockUserFindUnique.mockClear();
    mockTransaction.mockClear();
    mockTransaction.mockImplementation(
      async (cb: (tx: unknown) => Promise<unknown>) =>
        cb({ user: { create: mockUserCreate } })
    );
  });

  it("register creates user + 12 categorias and signs in", async () => {
    mockUserFindUnique.mockResolvedValueOnce(null);
    const fd = new FormData();
    fd.set("email", "novo@x.com");
    fd.set("password", "senha123");

    await register(undefined, fd);

    expect(mockHash).toHaveBeenCalledWith("senha123", 10);
    expect(mockTransaction).toHaveBeenCalledOnce();
    expect(mockUserCreate).toHaveBeenCalledOnce();
    const createArg = mockUserCreate.mock.calls[0][0];
    expect(createArg.data.email).toBe("novo@x.com");
    expect(createArg.data.passwordHash).toBe("$2b$HASH");
    expect(createArg.data.passwordHash).not.toBe("senha123");
    const seed = createArg.data.categorias.createMany.data;
    expect(seed).toHaveLength(12);
    expect(seed).toContainEqual({ nome: "Salário", tipo: "RECEITA" });
    expect(seed).toContainEqual({ nome: "Moradia", tipo: "DESPESA" });
    const uniquePairs = new Set(seed.map((c: { nome: string; tipo: string }) => `${c.nome}|${c.tipo}`));
    expect(uniquePairs.size).toBe(seed.length);
    expect(mockSignIn).toHaveBeenCalledWith(
      "credentials",
      expect.objectContaining({ email: "novo@x.com", password: "senha123" })
    );
  });

  it("register rejects duplicate e-mail without signIn", async () => {
    mockUserFindUnique.mockResolvedValueOnce({ id: "exists" });
    const fd = new FormData();
    fd.set("email", "novo@x.com");
    fd.set("password", "senha123");

    const result = await register(undefined, fd);

    expect(result).toEqual({ error: "E-mail já cadastrado." });
    expect(mockSignIn).not.toHaveBeenCalled();
    expect(mockUserCreate).not.toHaveBeenCalled();
  });

  it("register rejects short password before any DB call or hash", async () => {
    const fd = new FormData();
    fd.set("email", "novo@x.com");
    fd.set("password", "short");

    const result = await register(undefined, fd);

    expect(result).toEqual({ error: "A senha deve ter ao menos 8 caracteres." });
    expect(mockHash).not.toHaveBeenCalled();
    expect(mockUserFindUnique).not.toHaveBeenCalled();
    expect(mockUserCreate).not.toHaveBeenCalled();
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it("logout signs out redirecting to /login", async () => {
    await logout();
    expect(mockSignOut).toHaveBeenCalledWith({ redirectTo: "/login" });
  });

  it("login catches AuthError and returns inline message", async () => {
    const { AuthError } = await import("next-auth");
    mockSignIn.mockRejectedValueOnce(new AuthError("bad"));
    const fd = new FormData();
    fd.set("email", "x@y.z");
    fd.set("password", "wrong");
    const result = await login(undefined, fd);
    expect(result).toEqual({ error: "E-mail ou senha inválidos." });
  });
});
