export interface SunvoyCredentials {
  access_token: string;
  openId: string;
  userId: string;
  apiuser: string;
  operateId: string;
  language: string;
}

export interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface CachedCredentials extends SunvoyCredentials {
  cookies: string;
}
