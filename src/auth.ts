import fetch, { Response } from "node-fetch";
import { LOGIN_URL, CREDENTIALS } from "./constants";

export function extractCookies(res: Response): string {
  const raw = res.headers.raw()["set-cookie"];
  return raw ? raw.map((entry) => entry.split(";")[0]).join("; ") : "";
}

export async function loginAndGetCookies(): Promise<string> {
  //INFO: Get the login page to extract the nonce and initial cookies
  const loginPageRes = await fetch(LOGIN_URL);
  const loginPageHtml = await loginPageRes.text();
  const nonceMatch = loginPageHtml.match(/name="nonce" value="([^"]+)"/);
  if (!nonceMatch) {
    throw new Error("Nonce not found in login page");
  }
  const nonce = nonceMatch[1];

  //INFO: Extract initial cookies from GET /login
  const initialCookies = extractCookies(loginPageRes);

  //INFO: Prepare form data
  const params = new URLSearchParams();
  params.append("username", CREDENTIALS.username);
  params.append("password", CREDENTIALS.password);
  params.append("nonce", nonce);

  //INFO: POST to /login with the nonce and initial cookies
  const loginRes = await fetch(LOGIN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: initialCookies,
    },
    body: params.toString(),
    redirect: "manual",
  });

  //INFO: Accept 302 as a valid login response
  if (loginRes.status !== 302) {
    throw new Error(`Login failed: ${loginRes.status} ${loginRes.statusText}`);
  }

  //INFO: Merge cookies from GET and POST responses
  const loginCookies = extractCookies(loginRes);
  const allCookies = [initialCookies, loginCookies].filter(Boolean).join("; ");

  if (!allCookies) {
    throw new Error("No cookies received after login");
  }
  return allCookies;
}
