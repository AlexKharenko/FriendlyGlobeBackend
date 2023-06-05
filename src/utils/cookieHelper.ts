const ACCESS_TOKEN_COOKIE_ALIVE_MS = 30 * 60;
const REFRESH_TOKEN_COOKIE_ALIVE_MS = 30 * 24 * 60 * 60;

export const setAuthCookie = (res, refreshToken, accessToken) => {
  res
    .setCookie('refreshToken', refreshToken, {
      maxAge: REFRESH_TOKEN_COOKIE_ALIVE_MS,
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/',
    })
    .setCookie('accessToken', accessToken, {
      maxAge: ACCESS_TOKEN_COOKIE_ALIVE_MS,
      httpOnly: true,
      sameSite: 'none',
      secure: true,
      path: '/',
    });
};

export const removeAuthCookie = (res) => {
  res.setCookie('refreshToken', '', {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    path: '/',
    maxAge: 0,
  });
  res.setCookie('accessToken', '', {
    httpOnly: true,
    sameSite: 'none',
    secure: true,
    path: '/',
    maxAge: 0,
  });
};
