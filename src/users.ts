import fetch from "node-fetch";
import { USERS_API_URL } from "./constants";

export async function fetchUsers(cookies: string): Promise<any> {
  const res = await fetch(USERS_API_URL, {
    method: "POST",
    headers: {
      Cookie: cookies,
      Accept: "*/*",
      //   Origin: "https://challenge.sunvoy.com",
      //   Referer: "https://challenge.sunvoy.com/list",
      //   "User-Agent":
      //     "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch users: ${res.status} ${res.statusText}`);
  }
  return res.json();
}
