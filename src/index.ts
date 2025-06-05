import { fetchUsers } from "./users";
import { fetchCurrentUser, fetchCredentials } from "./currentUser";
import { promises as fs } from "fs";
import path from "path";
import { CachedCredentials } from "./interface";
import { loginAndGetCookies } from "./auth";
import { USERS_JSON_PATH } from "./constants";

const CREDENTIALS_PATH = path.join(__dirname, "../credentials.json");

async function getCachedCookies(): Promise<string | null> {
  try {
    const data = await fs.readFile(CREDENTIALS_PATH, "utf-8");
    const creds: CachedCredentials = JSON.parse(data);
    return creds.cookies;
  } catch {
    return null;
  }
}

async function saveCookiesToCache(cookies: string) {
  try {
    const data = await fs.readFile(CREDENTIALS_PATH, "utf-8");
    const creds: CachedCredentials = JSON.parse(data);
    creds.cookies = cookies;
    await fs.writeFile(
      CREDENTIALS_PATH,
      JSON.stringify(creds, null, 2),
      "utf-8"
    );
  } catch {
    //INFO: If no credentials yet, just save cookies
    await fs.writeFile(
      CREDENTIALS_PATH,
      JSON.stringify({ cookies }, null, 2),
      "utf-8"
    );
  }
}

async function ensureCookies(cookies: string | null) {
  if (!cookies) {
    cookies = await loginAndGetCookies();
    await saveCookiesToCache(cookies);
  }
  return cookies;
}

async function main() {
  console.log("Starting...");
  let cookies = await getCachedCookies();
  let reLoginTried = false;

  async function tryFetchAll() {
    if (!cookies) {
      console.log("No cookies found, logging in...");
      cookies = await ensureCookies(cookies);
    }

    try {
      console.log("Fetching users...");
      const users = await fetchUsers(cookies);
      console.log("Fetching current user...");
      const currentUser = await fetchCurrentUser(cookies);
      return { users, currentUser };
    } catch (err: unknown) {
      if (
        !reLoginTried &&
        err instanceof Error &&
        err.message &&
        err.message.includes("401")
      ) {
        //INFO: Try to re-login and retry once
        cookies = await loginAndGetCookies();
        await saveCookiesToCache(cookies);
        reLoginTried = true;
        return tryFetchAll();
      }
      throw err;
    }
  }

  const output = await tryFetchAll();
  const { users, currentUser } = output;

  await fs.writeFile(USERS_JSON_PATH, JSON.stringify(output, null, 2), "utf-8");
  console.log(
    `Fetched ${
      Array.isArray(users) ? users.length : 0
    } users and current user. Saved to users.json.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
