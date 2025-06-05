import fetch from "node-fetch";
import { TOKENS_URL, API_SETTINGS_URL } from "./constants";
import crypto from "crypto";
import { CurrentUser, CachedCredentials } from "./interface";
import { promises as fs } from "fs";
import path from "path";

const CREDENTIALS_PATH = path.join(__dirname, "../credentials.json");

function extractValue(html: string, id: string): string {
  const match = html.match(
    new RegExp(`<input[^>]+id=\"${id}\"[^>]+value=\"([^\"]+)\"`)
  );
  if (!match) throw new Error(`Could not find value for ${id}`);
  return match[1];
}

async function saveCredentialsToFile(creds: CachedCredentials) {
  const data = await fs.readFile(CREDENTIALS_PATH, "utf-8");
  // const data = {
  // ...creds,
  // fetchedAt: Date.now(),
  // };
  await fs.writeFile(
    CREDENTIALS_PATH,
    JSON.stringify(
      { ...JSON.parse(data), ...creds, fetchedAt: Date.now() },
      null,
      2
    ),
    "utf-8"
  );
}

async function loadCredentialsFromFile(): Promise<CachedCredentials> {
  const data = await fs.readFile(CREDENTIALS_PATH, "utf-8");
  return JSON.parse(data);
}

export async function fetchCredentials(
  cookies: string
): Promise<CachedCredentials> {
  //INFO: Fetch new credentials using the provided cookies
  const tokensRes = await fetch(TOKENS_URL, {
    headers: {
      Cookie: cookies,
    },
  });

  if (!tokensRes.ok) {
    throw new Error(
      `Failed to fetch tokens: ${tokensRes.status} ${tokensRes.statusText}`
    );
  }
  const html = await tokensRes.text();
  const creds: CachedCredentials = {
    access_token: extractValue(html, "access_token"),
    openId: extractValue(html, "openId"),
    userId: extractValue(html, "userId"),
    apiuser: extractValue(html, "apiuser"),
    operateId: extractValue(html, "operateId"),
    language: extractValue(html, "language"),
    cookies,
  };
  await saveCredentialsToFile(creds);
  return creds;
}

export async function fetchCurrentUser(cookies: string): Promise<CurrentUser> {
  console.log("Loading credentials from cache");
  let creds: CachedCredentials = await loadCredentialsFromFile();
  let triedRefresh = false;

  if (!creds.access_token) {
    //INFO: No cache, fetch new credentials
    console.log("No cache, fetching new credentials");
    creds = await fetchCredentials(cookies);
  }

  while (true) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const secret = "mys3cr3t";
    const paramsForCheckCode: Record<string, string> = {
      access_token: creds.access_token,
      apiuser: creds.apiuser,
      language: creds.language,
      openId: creds.openId,
      operateId: creds.operateId,
      userId: creds.userId,
      timestamp,
    };
    const sortedKeys = Object.keys(paramsForCheckCode).sort();
    const payload = sortedKeys
      .map((key) => `${key}=${encodeURIComponent(paramsForCheckCode[key])}`)
      .join("&");
    const hmac = crypto.createHmac("sha1", secret);
    hmac.update(payload);
    const checkCode = hmac.digest("hex").toUpperCase();

    //INFO: Prepare form data for /api/settings
    const params = new URLSearchParams();
    params.append("access_token", creds.access_token);
    params.append("apiuser", creds.apiuser);
    params.append("language", creds.language);
    params.append("openId", creds.openId);
    params.append("operateId", creds.operateId);
    params.append("userId", creds.userId);
    params.append("timestamp", timestamp);
    params.append("checkcode", checkCode);

    //INFO: POST to external API to get current user info
    const currentUserRes = await fetch(API_SETTINGS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (currentUserRes.ok) {
      return currentUserRes.json();
    } else if (
      (currentUserRes.status === 401 || currentUserRes.status === 404) &&
      !triedRefresh
    ) {
      //INFO: Unauthorized, try to refresh credentials and retry once
      console.log("Request failed, trying to refresh credentials");
      creds = await fetchCredentials(cookies);
      triedRefresh = true;
      continue;
    } else {
      throw new Error(
        `Failed to fetch current user: ${currentUserRes.status} ${currentUserRes.statusText}`
      );
    }
  }
}
