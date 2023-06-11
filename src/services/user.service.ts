import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CreateUserDto } from 'src/dtos/create-user.dto';
import { Sex } from '@prisma/client';
import {
  AdminAllUsersSelect,
  AllUsersSelect,
} from 'src/interfaces/user.interface';
import { v4 } from 'uuid';
import { createWriteStream } from 'fs';
import { extname, join, dirname } from 'path';
import * as fs from 'fs';
import { ageFilter } from 'src/utils/ageFilter';
import { UpdateUserDto } from 'src/dtos/update-user.dto';
import * as bcrypt from 'bcrypt';
import * as util from 'util';
import { pipeline } from 'stream';
import { createFoldersIfNotExist } from 'src/utils/createFoldersIfNotExist';
const pump = util.promisify(pipeline);

const PAGE_SIZE = 12;

@Injectable()
export class UserService {
  constructor(private prismaService: PrismaService) {}
  excludeUserFields(user, keys) {
    for (const key of keys) {
      delete user[key];
    }
    return user;
  }

  async getAllUsers(
    userId,
    filters: {
      verified?: boolean;
      blocked?: boolean;
      hidden?: boolean;
    },
    searchString,
    orderBy,
    page,
  ) {
    const users = await this.prismaService.user.findMany({
      where: {
        ...filters,
        OR: [
          {
            username: { contains: searchString },
          },
          { email: { contains: searchString } },
        ],
        NOT: {
          userId,
        },
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { createdAt: orderBy },
      select: {
        ...AdminAllUsersSelect,
      },
    });
    const count = await this.prismaService.user.count({
      where: {
        ...filters,
        NOT: {
          userId,
        },
      },
    });
    return {
      users,
      count,
    };
  }

  async getUsers(userId, filters, orderBy, page) {
    const {
      searchString,
      countryList,
      languageList,
      hobbyList,
      minAge,
      maxAge,
      sexId,
    } = filters;
    const users = await this.prismaService.user.findMany({
      where: {
        AND: [
          {
            username: {
              contains: searchString,
            },
          },
          {
            languages: {
              some: {
                languageId: {
                  in: languageList,
                },
              },
            },
          },
          {
            hobbies: {
              some: {
                hobbyId: {
                  in: hobbyList,
                },
              },
            },
          },
          {
            country: { countryId: { in: countryList } },
          },
          ageFilter(minAge, maxAge),
          { sexId },
        ],

        verified: true,
        blocked: false,
        hidden: false,
        NOT: {
          OR: [
            { blockedByUsers: { some: { blockedUserId: userId } } },
            { blocksUsers: { some: { blockedByUserId: userId } } },
          ],
        },
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      orderBy: { createdAt: orderBy },
      select: { ...AllUsersSelect },
    });
    const count = await this.prismaService.user.count({
      where: {
        AND: [
          {
            username: {
              contains: searchString,
            },
          },
          {
            languages: {
              some: {
                languageId: {
                  in: languageList,
                },
              },
            },
          },
          {
            hobbies: {
              some: {
                hobbyId: {
                  in: hobbyList,
                },
              },
            },
          },
          {
            country: { countryId: { in: countryList } },
          },
          { sexId },
          ageFilter(minAge, maxAge),
        ],
        verified: true,
        blocked: false,
        hidden: false,
        NOT: {
          OR: [
            { blockedByUsers: { some: { blockedUserId: userId } } },
            { blocksUsers: { some: { blockedByUserId: userId } } },
          ],
        },
      },
    });
    return {
      users,
      count,
    };
  }

  async getUsersFromBlackList(userId) {
    const users = await this.prismaService.user.findMany({
      where: {
        blocked: false,
        blocksUsers: {
          some: {
            blockedByUserId: userId,
          },
        },
      },
      select: { ...AllUsersSelect },
    });

    return users;
  }

  async blockUser(userId, blockMessage) {
    const data: any = {};
    if (blockMessage) {
      data.blockedUserMessage = {
        upsert: { create: { blockMessage }, update: { blockMessage } },
      };
    }
    await this.prismaService.chat.deleteMany({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
    });
    await this.prismaService.refreshToken.deleteMany({ where: { userId } });
    return await this.prismaService.user.update({
      where: { userId },
      data: { blocked: true, ...data },
    });
  }

  async unblockUser(userId) {
    await this.prismaService.user.update({
      where: { userId },
      data: { blocked: false },
    });
    return await this.prismaService.blockedUserMessage.deleteMany({
      where: { userId },
    });
  }

  async verifyUser(userId) {
    return await this.prismaService.user.update({
      where: { userId },
      data: { verified: true },
    });
  }

  async blacklistUser(blockedUserId, blockedByUserId) {
    await this.prismaService.blackList.create({
      data: {
        blockedUser: { connect: { userId: blockedUserId } },
        blockedByUser: { connect: { userId: blockedByUserId } },
      },
    });
    await this.prismaService.chat.deleteMany({
      where: {
        OR: [
          { user1Id: blockedUserId, user2Id: blockedByUserId },
          { user1Id: blockedByUserId, user2Id: blockedUserId },
        ],
      },
    });
  }

  async removeUserFromBlackList(blockedUserId, blockedByUserId) {
    try {
      await this.prismaService.blackList.delete({
        where: {
          blockedUserId_blockedByUserId: {
            blockedUserId,
            blockedByUserId,
          },
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new BadRequestException(
          `User with id ${blockedUserId} not found`,
        );
      }
    }
  }

  async findUserByEmail(email: string) {
    return await this.prismaService.user.findUnique({
      where: { email },
      select: {
        userId: true,
        username: true,
        email: true,
        password: true,
        blocked: true,
        verified: true,
        hidden: true,
        profilePhotoURL: true,
        blockedUserMessage: { select: { blockMessage: true } },
        role: true,
      },
    });
  }

  async findUserByUserId(userId: number) {
    const user = await this.prismaService.user.findUnique({
      where: { userId },
      select: {
        userId: true,
        username: true,
        email: true,
        blocked: true,
        verified: true,
        hidden: true,
        profilePhotoURL: true,
        role: true,
      },
    });
    return user;
  }

  async findUserByUsername(username: string) {
    const user = await this.prismaService.user.findUnique({
      where: { username },
      include: {
        country: true,
        userDetails: true,
        languages: true,
        hobbies: true,
      },
    });
    if (!user) return null;
    return this.excludeUserFields(user, ['password', 'role']);
  }

  async checkUserAvailability(userId, lookingForUserId) {
    const isAllowed = await this.prismaService.blackList.findMany({
      where: {
        OR: [
          {
            blockedUserId: lookingForUserId,
            blockedByUserId: userId,
          },
          {
            blockedUserId: userId,
            blockedByUserId: lookingForUserId,
          },
        ],
      },
    });
    const { verified, blocked, hidden } =
      await this.prismaService.user.findUnique({
        where: { userId: lookingForUserId },
        select: { verified: true, blocked: true, hidden: true },
      });

    if (
      (isAllowed.length !== 0 || !verified || blocked || hidden) &&
      userId !== lookingForUserId
    ) {
      throw new NotFoundException('User not found');
    }
    return;
  }

  async createUser(createUserDTO: CreateUserDto): Promise<{ userId: number }> {
    return await this.prismaService.user.create({
      data: {
        firstName: createUserDTO.firstName,
        secondName: createUserDTO.secondName,
        username: createUserDTO.username,
        email: createUserDTO.email,
        password: createUserDTO.password,
        sexId: Sex[createUserDTO.sexId],
        birthdayDate: new Date(createUserDTO.birthdayDate),
        country: { connect: { countryId: createUserDTO.country.countryId } },
        languages: {
          connect: [
            ...createUserDTO.languages.map((language) => {
              return { languageId: language.languageId };
            }),
          ],
        },
        hobbies: {
          connect: [
            ...createUserDTO.hobbies.map((hobby) => {
              return { hobbyId: hobby.hobbyId };
            }),
          ],
        },
        userDetails: {
          create: {
            bio: createUserDTO.bio,
            lookingForText: createUserDTO.lookingForText,
          },
        },
      },
      select: {
        userId: true,
      },
    });
  }

  async updateUser(
    userId,
    updateUserDTO: UpdateUserDto,
  ): Promise<{ userId: number }> {
    return await this.prismaService.user.update({
      where: { userId },
      data: {
        firstName: updateUserDTO.firstName,
        secondName: updateUserDTO.secondName,
        sexId: Sex[updateUserDTO.sexId],
        birthdayDate: new Date(updateUserDTO.birthdayDate),
        country: { connect: { countryId: updateUserDTO.country.countryId } },
        verified: false,
        languages: {
          connect: [
            ...updateUserDTO.languages.map((language) => {
              return { languageId: language.languageId };
            }),
          ],
        },
        hobbies: {
          connect: [
            ...updateUserDTO.hobbies.map((hobby) => {
              return { hobbyId: hobby.hobbyId };
            }),
          ],
        },
        userDetails: {
          update: {
            bio: updateUserDTO.bio,
            lookingForText: updateUserDTO.lookingForText,
          },
        },
      },
    });
  }

  async updatePassword(userId: number, password: string) {
    const saltSize = process.env.BCRYPT_SALT;
    const hashedPassword = await bcrypt.hash(password, +saltSize);

    await this.prismaService.user.update({
      where: { userId },
      data: {
        password: hashedPassword,
      },
    });
  }

  async updateProfileVisibility(userId: number, hidden: boolean) {
    await this.prismaService.user.update({
      where: { userId },
      data: {
        hidden,
      },
    });
  }

  async deleteProfile(userId: number) {
    const { profilePhotoURL } = await this.prismaService.user.findUnique({
      where: { userId },
      select: { profilePhotoURL: true },
    });
    await this.prismaService.user.deleteMany({
      where: { userId },
    });

    if (profilePhotoURL) await this.removeProfilePhotoFile(profilePhotoURL);
  }

  async deleteProfilePhoto(userId: number) {
    const { profilePhotoURL } = await this.prismaService.user.findUnique({
      where: { userId },
      select: { profilePhotoURL: true },
    });
    await this.prismaService.user.update({
      where: { userId },
      data: {
        profilePhotoURL: null,
      },
    });
    if (profilePhotoURL) await this.removeProfilePhotoFile(profilePhotoURL);
  }

  async removeProfilePhotoFile(profielPhotoURL: string) {
    const parentDir = dirname(dirname(dirname(__dirname)));
    await fs.unlink(
      join(parentDir, 'public', 'uploads', 'images', profielPhotoURL),
      (err) => {
        return err;
      },
    );
  }
  async createUserProfilePhoto(userId: number, profilePhoto: any) {
    const user = await this.findUserByUserId(userId);
    if (!user) throw new BadRequestException('User not found');
    if (user.profilePhotoURL) {
      await this.removeProfilePhotoFile(user.profilePhotoURL);
    }
    const filename = `${v4()}${extname(profilePhoto.filename)}`;
    const parentDir = dirname(dirname(dirname(__dirname)));
    const folderPath = join(parentDir, 'public', 'uploads', 'images');
    await createFoldersIfNotExist(folderPath);
    const stream = createWriteStream(join(folderPath, filename));
    await pump(profilePhoto.file, stream);
    await this.prismaService.user.update({
      where: { userId },
      data: { profilePhotoURL: filename },
    });
    return filename;
  }
}
