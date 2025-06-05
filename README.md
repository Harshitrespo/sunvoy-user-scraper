# Sunvoy User Scraper

## Overview

This project provides a Node.js script (written in TypeScript) to fetch user data and the currently authenticated user from the Sunvoy challenge API. It is designed to minimize unnecessary logins by caching authentication credentials and cookies between runs.

## Features

- Fetches all users and the current user from the Sunvoy API.
- Caches authentication credentials and cookies in `credentials.json` to avoid repeated logins.
- Automatically refreshes credentials and cookies if a 401/404 Unauthorized error is encountered, and retries the request.
- Robust error handling and clear logging for easier debugging.

## Authentication & Credential Caching

- On the first run, the script logs in and saves the authentication cookies and credentials to `credentials.json`.
- On subsequent runs, the script loads cookies and credentials from `credentials.json` and uses them for all API requests.
- If a request fails with a 401 or 404 Unauthorized error, the script will automatically re-login, update the cache, and retry the request once.
- This mechanism ensures efficient use of authentication and reduces unnecessary logins.

### Clearing the Cache

If you want to force a fresh login (for example, if your credentials or cookies are invalid), simply delete the `credentials.json` file in the project root. The script will log in again on the next run.

## Usage

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the script:
   ```bash
   npm start
   ```
   or
   ```bash
   ts-node src/index.ts
   ```
3. The output will be saved to `users.json` in the project root.

## Project Structure

- `src/index.ts` - Main entry point. Handles credential/cookie caching and orchestrates user data fetching.
- `src/currentUser.ts` - Logic for fetching the current user, with credential/cookie refresh logic.
- `src/users.ts` - Logic for fetching all users.
- `src/auth.ts` - Handles login and cookie retrieval.
- `src/interface.ts` - TypeScript interfaces for type safety.
- `credentials.json` - Stores cached credentials and cookies (auto-generated).
- `users.json` - Output file with fetched user data.

## Notes

- If you encounter repeated authentication errors, try deleting `credentials.json` to force a fresh login.
