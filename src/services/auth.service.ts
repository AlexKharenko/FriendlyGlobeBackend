import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from 'src/dtos/create-user.dto';

import * as bcrypt from 'bcrypt';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private tokenService: TokenService,
  ) {}
  async signUp(createUserDTO: CreateUserDto) {
    const foundUserByEmail = await this.userService.findUserByEmail(
      createUserDTO.email,
    );
    if (foundUserByEmail)
      throw new BadRequestException('User with this email already exists!');
    const foundUserByUsername = await this.userService.findUserByUsername(
      createUserDTO.username,
    );
    if (foundUserByUsername)
      throw new BadRequestException('User with this username already exists!');
    const saltSize = process.env.BCRYPT_SALT;
    const hash = await bcrypt.hash(createUserDTO.password, +saltSize);
    createUserDTO.password = hash;
    await this.userService.createUser(createUserDTO);
  }
  async signIn(email: string, password: string) {
    const foundUserByEmail = await this.userService.findUserByEmail(email);
    if (!foundUserByEmail) throw new BadRequestException('Bad credentials!');
    const { password: userPassword, blocked, ...user } = foundUserByEmail;
    const isPasswordCorrect = await bcrypt.compare(password, userPassword);
    if (!isPasswordCorrect) throw new BadRequestException('Bad credentials!');
    if (blocked)
      throw new ForbiddenException(
        `Your account has been blocked! Reason: ${
          foundUserByEmail?.blockedUserMessage?.blockMessage || ''
        }`,
      );
    const { tokens } = await this.tokenGenLogic(user);
    return { ...tokens, user };
  }
  async tokenGenLogic(user) {
    const tokens = this.tokenService.generateTokens(user);
    await this.tokenService.saveRefreshToken(user.userId, tokens.refreshToken);
    return { user, tokens };
  }
  async signOut(refreshToken) {
    await this.tokenService.deleteRefreshTokenFromDB(refreshToken);
  }
  async refreshToken(refreshToken) {
    if (!refreshToken) throw new UnauthorizedException();
    const userData = this.tokenService.validateRefreshToken(refreshToken);
    if (!userData) throw new UnauthorizedException();
    const tokenFromDB = await this.tokenService.getRefreshToken(refreshToken);
    if (!tokenFromDB) throw new UnauthorizedException();

    const user = await this.userService.findUserByUserId(userData.userId);
    if (user.blocked) throw new BadRequestException('You are blocked!');
    const { tokens } = await this.tokenGenLogic(user);

    return { ...tokens, user };
  }
}
