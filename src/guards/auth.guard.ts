import {
  Injectable,
  Inject,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenService } from 'src/services/token.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(TokenService)
    private readonly tokenService: TokenService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const { accessToken } = req?.cookies;
    if (accessToken) {
      const payload = await this.validate(accessToken);
      if (payload) {
        req.payload = payload;
        req.isAdmin = payload.role === 'ADMIN' ? true : false;
        return true;
      }
    }
    throw new UnauthorizedException();
  }
  async validate(token: string) {
    try {
      return await this.tokenService.validateAccessToken(token);
    } catch (e) {
      throw new ForbiddenException();
    }
  }
}
