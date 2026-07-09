import { describe, expect, it } from "vitest";

import { signup } from "../app/actions/auth";
import { verifyCredentials } from "../lib/auth-credentials";
import { handlers } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { getCategoriesByUser, DEFAULT_CATEGORIES } from "../lib/categories";
import { compare } from "bcryptjs";

async function createUserForm(email: string, password: string) {
  const form = new FormData();
  form.append("email", email);
  form.append("password", password);
  return form;
}

async function loginAndGetSessionCookie(email: string, password: string) {
  const csrfResponse = await handlers.GET(
    new Request("http://localhost:3000/api/auth/csrf"),
  );
  const csrfCookies = csrfResponse.headers.getSetCookie();
  const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };

  const body = new URLSearchParams({
    email,
    password,
    csrfToken,
    callbackUrl: "/dashboard",
    json: "true",
  });

  const response = await handlers.POST(
    new Request("http://localhost:3000/api/auth/callback/credentials", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        cookie: csrfCookies.map((c) => c.split(";")[0]).join("; "),
      },
      body,
    }),
  );

  expect(response.status).toBe(302);
  const cookies = response.headers.getSetCookie();
  const sessionCookie = cookies
    .find((c) => c.startsWith("authjs.session-token"))
    ?.split(";")[0];
  expect(sessionCookie).toBeDefined();
  return sessionCookie!;
}

describe("auth integration", () => {
  it("stores a bcrypt-hashed password and rejects duplicate e-mails", async () => {
    const form = await createUserForm("User1@Example.com", "password123");
    const first = await signup(form);
    expect(first).toEqual({ success: true });

    const user = await prisma.user.findUnique({
      where: { email: "user1@example.com" },
    });
    expect(user).not.toBeNull();
    expect(user!.password).toBeTruthy();
    expect(await compare("password123", user!.password!)).toBe(true);

    const duplicate = await signup(
      await createUserForm("user1@example.com", "password123"),
    );
    expect(duplicate).toHaveProperty("error");

    const loginWithMixedCase = await verifyCredentials(
      "USER1@EXAMPLE.COM",
      "password123",
    );
    expect(loginWithMixedCase).not.toBeNull();
    expect(loginWithMixedCase?.email).toBe("user1@example.com");
  });

  it("seeds 10 default categories linked to the new user", async () => {
    const email = "user2@example.com";
    const result = await signup(await createUserForm(email, "password123"));
    expect(result).toEqual({ success: true });

    const user = await prisma.user.findUnique({ where: { email } });
    const categories = await getCategoriesByUser(user!.id);
    expect(categories).toHaveLength(10);

    for (const expected of DEFAULT_CATEGORIES) {
      expect(categories.map((c) => c.nome)).toContain(expected.nome);
      const found = categories.find((c) => c.nome === expected.nome);
      expect(found?.tipo).toBe(expected.tipo);
      expect(found?.userId).toBe(user!.id);
    }
  });

  it("keeps each user's categories isolated", async () => {
    const a = await signup(
      await createUserForm("userA@example.com", "password123"),
    );
    const b = await signup(
      await createUserForm("userB@example.com", "password123"),
    );
    expect(a).toEqual({ success: true });
    expect(b).toEqual({ success: true });

    const userA = await prisma.user.findUnique({
      where: { email: "usera@example.com" },
    });
    const userB = await prisma.user.findUnique({
      where: { email: "userb@example.com" },
    });

    const categoriesA = await getCategoriesByUser(userA!.id);
    const categoriesB = await getCategoriesByUser(userB!.id);

    const idsA = new Set(categoriesA.map((c) => c.id));
    const idsB = new Set(categoriesB.map((c) => c.id));

    expect(idsA.size).toBe(10);
    expect(idsB.size).toBe(10);
    for (const id of idsB) {
      expect(idsA.has(id)).toBe(false);
    }
  });

  it("verifies correct credentials and rejects wrong passwords", async () => {
    await signup(
      await createUserForm("user3@example.com", "password123"),
    );

    const valid = await verifyCredentials("user3@example.com", "password123");
    expect(valid).not.toBeNull();
    expect(valid?.email).toBe("user3@example.com");

    const invalid = await verifyCredentials(
      "user3@example.com",
      "wrong-password",
    );
    expect(invalid).toBeNull();
  });

  it("returns a session for a valid JWT cookie and null without it", async () => {
    const email = "user4@example.com";
    await signup(await createUserForm(email, "password123"));

    const sessionCookie = await loginAndGetSessionCookie(email, "password123");

    const authenticatedResponse = await handlers.GET(
      new Request("http://localhost:3000/api/auth/session", {
        headers: { cookie: sessionCookie },
      }),
    );
    const authenticated = (await authenticatedResponse.json()) as {
      user?: { id: string; email: string };
    };
    expect(authenticated.user?.id).toBeDefined();
    expect(authenticated.user?.email).toBe(email);

    const anonymousResponse = await handlers.GET(
      new Request("http://localhost:3000/api/auth/session"),
    );
    const anonymous = (await anonymousResponse.json()) as {
      user?: unknown;
    } | null;
    expect(anonymous?.user ?? anonymous).toBeNull();
  });
});
