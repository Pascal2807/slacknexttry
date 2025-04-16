import { Hono } from "hono";
import { faker } from "@faker-js/faker";

import { jwt, requireScope } from "./middlewares/jwt";
import type { JWTHeaderParameters, JWTPayload } from "jose";

type Bindings = {
	AUTH0_DOMAIN: string;
	AUTH0_CLIENT_ID: string;
	AUTH0_CLIENT_SECRET: string;
	AUTH0_AUDIENCE: string;
	AUTH0_SCOPE: string;
	API_BASE_URL: string;
  };

const app = new Hono<{
	Bindings: Bindings;
	Variables: {
		jwtPayload: JWTPayload;
		jwtProtectedHeader: JWTHeaderParameters;
	};
}>();

/**
 * GET /api/health
 * Basic health check endpoint.
 */
app.get("/api/health", async (c) => {
	console.error("DEBUG AUTH0_DOMAIN:", c.env.AUTH0_DOMAIN);
	return c.json({
	  status: "ok",
	  domain: c.env.AUTH0_DOMAIN,
	  timestamp: new Date().toISOString(),
	});
  });

/**
 * Middleware to verify the JWT token.
 * The routes defined after this middleware will be protected and require a valid JWT token.
 */
app.use("*", jwt());

/**
 * GET /api/me
 * Returns the current user's claims.
 */
app.get("/api/me", (c) => {
	const claims = c.var.jwtPayload as JWTPayload;
	return c.json({
		...claims,
	});
});

/**
 * GET /api/todos
 * Returns the current user's todos.
 */
app.get("/api/todos", requireScope("read:todos"), async (c) => {
	const user = c.var.jwtPayload as JWTPayload;

	return c.json({
		todos: faker.helpers.multiple(
			() => ({
				id: faker.string.uuid(),
				owner: user.sub,
				title: faker.lorem.sentence(),
				description: faker.lorem.paragraph(),
				date: faker.date.future(),
			}),
			{
				count: 5,
			},
		),
	});
});

/**
 * GET /api/billing
 * Returns the billing settings.
 */
app.get("/api/billing", requireScope("read:billing"), async (c) => {
	return c.json({
		billing: {
			method: "credit-card",
			last4: "1234",
			expiration: "01/2025",
		},
	});
});

export default app;
