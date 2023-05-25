import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { UserService } from './user.service';

@Injectable()
export class ChatService {
  constructor(
    private prismaService: PrismaService,
    private userService: UserService,
  ) {}

  async deleteChatByUsersId(user1Id, user2Id) {
    await this.prismaService.chat.deleteMany({
      where: {
        OR: [
          { user1Id, user2Id },
          { user1Id: user2Id, user2Id: user1Id },
        ],
      },
    });
  }

  async deleteAllChatsWithUserId(userId) {
    await this.prismaService.chat.deleteMany({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
    });
  }

  async deleteChatByChatId(chatId) {
    await this.prismaService.chat.deleteMany({
      where: { chatId },
    });
  }

  async getChats(userId: number) {
    const chats = await this.prismaService.chat.findMany({
      where: {
        OR: [
          {
            user1Id: userId,
          },
          {
            user2Id: userId,
          },
        ],
      },
      select: {
        chatId: true,
        user1: {
          select: {
            userId: true,
            username: true,
            profilePhotoURL: true,
          },
        },
        user2: {
          select: {
            userId: true,
            username: true,
            profilePhotoURL: true,
          },
        },
        messages: {
          select: {
            messageId: true,
            chatId: true,
            senderId: true,
            receiverId: true,
            content: true,
            timeCreated: true,
            edited: true,
            timeEdited: true,
            read: true,
          },
          orderBy: {
            timeCreated: 'desc',
          },
          take: 1,
        },
      },
    });
    const chatsWithUnreadCount = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await this.prismaService.message.count({
          where: {
            chatId: chat.chatId,
            receiverId: userId,
            read: false,
          },
        });

        return {
          ...chat,
          unreadCount,
        };
      }),
    );
    const sortedChats = chatsWithUnreadCount.sort(
      (a, b) =>
        b.messages[0]?.timeCreated.getTime() -
        a.messages[0]?.timeCreated.getTime(),
    );
    return sortedChats;
  }

  async getChatById(chatId) {
    const chat = await this.prismaService.chat.findUnique({
      where: {
        chatId,
      },
      select: {
        chatId: true,
        user1: {
          select: {
            userId: true,
            username: true,
            profilePhotoURL: true,
          },
        },
        user2: {
          select: {
            userId: true,
            username: true,
            profilePhotoURL: true,
          },
        },
      },
    });
    return chat;
  }

  async getChatByUsersIds(user1Id, user2Id) {
    const chat = await this.prismaService.chat.findFirst({
      where: {
        OR: [
          { user1Id, user2Id },
          { user1Id: user2Id, user2Id: user1Id },
        ],
      },
      select: {
        chatId: true,
        user1: {
          select: {
            userId: true,
            username: true,
            profilePhotoURL: true,
          },
        },
        user2: {
          select: {
            userId: true,
            username: true,
            profilePhotoURL: true,
          },
        },
      },
    });
    return chat;
  }

  async createChat(userId, newFriendUserId) {
    await this.userService.checkUserAvailability(userId, newFriendUserId);
    const existingChat = await this.getChatByUsersIds(userId, newFriendUserId);
    if (existingChat) return existingChat;
    const chat = await this.prismaService.chat.create({
      data: {
        user1Id: userId,
        user2Id: newFriendUserId,
      },
      select: {
        chatId: true,
        user1: {
          select: {
            userId: true,
            username: true,
            profilePhotoURL: true,
          },
        },
        user2: {
          select: {
            userId: true,
            username: true,
            profilePhotoURL: true,
          },
        },
        messages: {
          select: {
            messageId: true,
            chatId: true,
            senderId: true,
            receiverId: true,
            content: true,
            timeCreated: true,
            edited: true,
            timeEdited: true,
            read: true,
          },
          orderBy: {
            timeCreated: 'desc',
          },
          take: 1,
        },
      },
    });
    const message = await this.prismaService.message.create({
      data: {
        chatId: chat.chatId,
        senderId: userId,
        receiverId: newFriendUserId,
        content: 'Hello!(Automatical generated!)',
      },
    });
    chat.messages = [message];
    return chat;
  }
}
