import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ChatService } from './chat.service';

const MESSAGES_LIST_SIZE = 50;

@Injectable()
export class MessageService {
  constructor(
    private prismaService: PrismaService,
    private chatService: ChatService,
  ) {}

  async getMessages(chatId: number, lastMessageTimeCreated?: string) {
    let timeCreated: any = {};
    if (lastMessageTimeCreated)
      timeCreated = { lt: new Date(lastMessageTimeCreated).toISOString() };
    const messages = await this.prismaService.message.findMany({
      where: {
        chatId,
        timeCreated,
      },
      orderBy: {
        timeCreated: 'desc',
      },
      take: MESSAGES_LIST_SIZE,
    });
    return messages;
  }

  async getMessageById(messageId: string) {
    const message = await this.prismaService.message.findFirst({
      where: { messageId },
    });
    return message;
  }

  async deleteMessage(senderId: number, messageId: string) {
    const message = await this.getMessageById(messageId);
    if (!message) throw new Error('No message found!');
    if (message.senderId !== senderId)
      throw new Error('You can not delete not your own messages!');
    const deletedMessage = await this.prismaService.message.delete({
      where: { messageId },
    });
    return deletedMessage;
  }

  async readMessagesInChat(chatId: number, receiverId: number) {
    await this.prismaService.message.updateMany({
      where: { chatId, receiverId, read: false },
      data: { read: true },
    });
  }

  async updateMessage(senderId: number, messageId: string, messageContent) {
    const message = await this.getMessageById(messageId);
    if (!message) throw new Error('No message found!');
    if (message.senderId !== senderId)
      throw new Error('Only sender can change the message!');
    const editedMessage = await this.prismaService.message.update({
      where: { messageId },
      data: {
        edited: true,
        timeEdited: new Date(),
        content: messageContent,
      },
    });
    return editedMessage;
  }

  async createMessage(senderId: number, receiverId: number, message: string) {
    const chatByUsersId = await this.chatService.getChatByUsersIds(
      senderId,
      receiverId,
    );
    if (!chatByUsersId) throw new Error("Can't find chat!");
    const newMessage = await this.prismaService.message.create({
      data: {
        chatId: chatByUsersId.chatId,
        senderId,
        receiverId,
        content: message,
      },
    });
    return newMessage;
  }
}
