import { Body, Controller, Post, Res, Req } from '@nestjs/common';
import { CreateUserDto } from 'src/dtos/create-user.dto';
import { AuthService } from 'src/services/auth.service';
import { removeAuthCookie, setAuthCookie } from 'src/utils/cookieHelper';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async SignUp(@Body() body: CreateUserDto) {
    await this.authService.signUp(body);
    return { success: true };
  }
  @Post('signin')
  async SignIn(@Body() body, @Res({ passthrough: true }) res) {
    const { email, password } = body;
    const { refreshToken, accessToken, user } = await this.authService.signIn(
      email,
      password,
    );
    setAuthCookie(res, refreshToken, accessToken);
    res.status(200);
    return { success: true, user };
  }
  @Post('signout')
  async logout(@Req() req, @Res({ passthrough: true }) res) {
    const { refreshToken } = req?.cookies;
    await this.authService.signOut(refreshToken);
    removeAuthCookie(res);
    res.status(200);
    return { success: true };
  }
  @Post('auth/refresh')
  async refreshToken(@Req() req, @Res({ passthrough: true }) res) {
    const cookies = req.cookies;
    const { refreshToken, accessToken, user } =
      await this.authService.refreshToken(cookies.refreshToken);

    setAuthCookie(res, refreshToken, accessToken);
    res.status(200);
    return { success: true, user };
  }
}
