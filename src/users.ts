import fetch from "node-fetch";
import { USERS_API_URL } from "./constants";
import { CurrentUser } from "./interface";

export async function fetchUsers(cookies: string): Promise<CurrentUser[]> {
  const res = await fetch(USERS_API_URL, {
    method: "POST",
    headers: {
      Cookie: cookies,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch users: ${res.status} ${res.statusText}`);
  }

  return res.json();
}
