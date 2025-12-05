export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Clerk sign-in URL (redirects to Clerk's hosted sign-in page)
export const getLoginUrl = (redirectUrl?: string) => {
  const baseUrl = "/sign-in";
  if (redirectUrl) {
    return `${baseUrl}?redirect_url=${encodeURIComponent(redirectUrl)}`;
  }
  return baseUrl;
};
