import {
  Controller,
  Get,
  UseGuards,
  Param,
  NotFoundException,
  Query,
  Req,
  Post,
  Body,
  Delete,
  BadRequestException,
  ForbiddenException,
  Patch,
  Res,
} from '@nestjs/common';
import { UserService } from 'src/services/user.service';
import { AuthGuard } from 'src/guards/auth.guard';
import { parseBool } from 'src/utils/parseBool';
import { parseArray } from 'src/utils/parseArray';
import { AdminGuard } from 'src/guards/admin.guard';
import { VerifiedGuard } from 'src/guards/verified.guard';
import { BlockedGuard } from 'src/guards/blocked.guard';
import { UpdateUserHiddenDto } from 'src/dtos/update-user-hidden.dto';
import { UpdateUserPasswordDto } from 'src/dtos/update-user-password.dto copy';
import { UpdateUserDto } from 'src/dtos/update-user.dto';
import { removeAuthCookie } from 'src/utils/cookieHelper';
import { AddToBlacklistDto } from 'src/dtos/addToBlacklist.dto';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(AuthGuard, BlockedGuard)
  @Patch('/users/profile/hidden')
  async updateProfileVisibility(@Req() req, @Body() body: UpdateUserHiddenDto) {
    await this.userService.updateProfileVisibility(
      req.payload.userId,
      body.hidden,
    );

    return { success: true };
  }

  @UseGuards(AuthGuard, BlockedGuard)
  @Patch('/users/profile/password')
  async updatePassword(@Req() req, @Body() body: UpdateUserPasswordDto) {
    await this.userService.updatePassword(req.payload.userId, body.password);

    return { success: true };
  }

  @UseGuards(AuthGuard, BlockedGuard)
  @Delete('/users/profile')
  async deleteProfile(@Req() req, @Res({ passthrough: true }) res) {
    const { userId } = req.payload;
    await this.userService.deleteProfile(userId);
    removeAuthCookie(res);
    res.status(200);
    return { success: true, signOut: true };
  }

  @UseGuards(AuthGuard, BlockedGuard)
  @Patch('/users/profile')
  async updateUser(
    @Req() req,
    @Res({ passthrough: true }) res,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    await this.userService.updateUser(req.payload.userId, updateUserDto);
    removeAuthCookie(res);
    res.status(200);
    return { success: true, signOut: true };
  }

  @UseGuards(AuthGuard, BlockedGuard)
  @Get('/users/profile')
  async getProfile(@Req() req) {
    const user = await this.userService.findUserByUsername(
      req.payload.username,
    );
    if (!user) throw new NotFoundException('No such user with this username!');
    delete user['verified'];
    delete user['blocked'];
    return { success: true, user };
  }

  @UseGuards(AuthGuard, BlockedGuard)
  @Get('/users/:username')
  async getUserByUsername(@Req() req, @Param('username') username) {
    const user = await this.userService.findUserByUsername(username);
    if (!user) throw new NotFoundException('No such user with this username!');
    if (req.isAdmin) {
      return { success: true, user };
    }
    if (!req.payload.verified && req.payload.userId !== user.userId)
      throw new ForbiddenException('You must be veiried');
    await this.userService.checkUserAvailability(
      req.payload.userId,
      user.userId,
    );
    delete user['verified'];
    delete user['blocked'];
    return { success: true, user };
  }

  @UseGuards(AuthGuard, AdminGuard, BlockedGuard)
  @Get('/admin/allusers')
  async getAllUsers(
    @Req() req,
    @Query('search') searchString: string,
    @Query('page') page: string,
    @Query('verified') verified?: string,
    @Query('blocked') blocked?: string,
    @Query('hidden') hidden?: string,
    @Query('orderBy') orderBy?: string,
  ) {
    const filters = {
      verified: parseBool(verified),
      blocked: parseBool(blocked),
      hidden: parseBool(hidden),
    };
    const { users, count } = await this.userService.getAllUsers(
      req.payload.userId,
      filters || {},
      searchString,
      orderBy,
      +page || 1,
    );

    return { success: true, users, count };
  }

  @UseGuards(AuthGuard, AdminGuard, BlockedGuard)
  @Patch('/admin/block/:userId')
  async blockUser(
    @Res({ passthrough: true }) res,
    @Body() body,
    @Param('userId') userId: number,
  ) {
    try {
      const { blockMessage } = body;
      await this.userService.blockUser(+userId, blockMessage);
      return { success: true };
    } catch (err) {
      res.status(400);
      return { success: false, message: 'Something went wrong, try later' };
    }
  }

  @UseGuards(AuthGuard, AdminGuard, BlockedGuard)
  @Patch('/admin/unblock/:userId')
  async unblockUser(
    @Res({ passthrough: true }) res,
    @Param('userId') userId: number,
  ) {
    try {
      await this.userService.unblockUser(+userId);
      return { success: true };
    } catch (err) {
      res.status(400);
      console.log(err);
      return { success: false, message: 'Something went wrong, try later' };
    }
  }

  @UseGuards(AuthGuard, AdminGuard, BlockedGuard)
  @Patch('/admin/verify/:userId')
  async verifyUser(
    @Res({ passthrough: true }) res,
    @Param('userId') userId: number,
  ) {
    try {
      await this.userService.verifyUser(+userId);
      return { success: true };
    } catch (err) {
      res.status(400);
      return { success: false, message: 'Something went wrong, try later' };
    }
  }

  @UseGuards(AuthGuard, VerifiedGuard, BlockedGuard)
  @Get('/users')
  async getUsers(
    @Req() req,
    @Query('page') page: string,
    @Query('sex') sex: string,
    @Query('orderBy') orderBy?: string,
    @Query('search') searchString?: string,
    @Query('countries') countryList?: string | undefined,
    @Query('languages') languageList?: string | undefined,
    @Query('hobbies') hobbyList?: string | undefined,
    @Query('minAge') minAge?: string,
    @Query('maxAge') maxAge?: string,
  ) {
    const filters = {
      searchString,
      countryList: parseArray(countryList),
      languageList: parseArray(languageList),
      hobbyList: parseArray(hobbyList),
      sexId: sex,
      minAge: +minAge,
      maxAge: +maxAge,
    };
    const { users, count } = await this.userService.getUsers(
      req.payload.userId,
      filters || {},
      orderBy,
      +page || 1,
    );

    return { success: true, users, count };
  }

  @UseGuards(AuthGuard, VerifiedGuard, BlockedGuard)
  @Get('/users/blacklist')
  async getUsersFromBlackList(@Req() req) {
    const users = await this.userService.getUsersFromBlackList(
      req.payload.userId,
    );

    return { success: true, users };
  }

  @UseGuards(AuthGuard, VerifiedGuard, BlockedGuard)
  @Post('/users/blacklist')
  async addUserToBlackList(@Req() req, @Body() body: AddToBlacklistDto) {
    if (body.blockedUserId == req.payload.userId)
      throw new BadRequestException('You can`t add yourself to blacklist');
    await this.userService.blacklistUser(
      body.blockedUserId,
      req.payload.userId,
    );

    return { success: true };
  }

  @UseGuards(AuthGuard, VerifiedGuard, BlockedGuard)
  @Delete('/users/blacklist/:blUserId')
  async removeUserFromBlackList(@Req() req, @Param('blUserId') blUserId) {
    await this.userService.removeUserFromBlackList(
      +blUserId,
      req.payload.userId,
    );

    return { success: true };
  }

  @UseGuards(AuthGuard, BlockedGuard)
  @Patch('users/profile/photo')
  async updateProfilePhoto(@Req() req) {
    const file = await req.file();
    if (!file) throw new BadRequestException('No file provided!');
    const profilePhotoURL = await this.userService.createUserProfilePhoto(
      req.payload.userId,
      file,
    );
    return {
      success: true,
      profilePhotoURL,
    };
  }

  @UseGuards(AuthGuard, BlockedGuard)
  @Delete('users/profile/photo')
  async deleteProfilePhoto(@Req() req) {
    await this.userService.deleteProfilePhoto(req.payload.userId);
    return {
      success: true,
    };
  }
}
