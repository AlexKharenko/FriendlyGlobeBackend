export const cookieParse = (cookies): any => {
  if (!cookies) return {};
  const parsedCookies = {};
  cookies.split('; ').forEach((cookie) => {
    const [key, value] = cookie.split('=');
    parsedCookies[key] = value;
  });
  return parsedCookies;
};
