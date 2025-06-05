import * as fs from "fs";
import { USERS_JSON_PATH } from "./constants";
import { loginAndGetCookies } from "./auth";
import { fetchUsers } from "./users";

async function main() {
  try {
    // TODO: Reuse credentials if available and valid
    const cookies = await loginAndGetCookies();
    const users = await fetchUsers(cookies);
    fs.writeFileSync(USERS_JSON_PATH, JSON.stringify(users, null, 2));
    console.log(
      `Fetched ${
        Array.isArray(users) ? users.length : 0
      } users. Saved to users.json.`
    );
    // TODO: Fetch current authenticated user and add to users.json
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

main();
