import { Injectable } from '@nestjs/common';
import { MessageService } from 'src/services/message.service';
import { ChatService } from 'src/services/chat.service';
import { Server } from 'ws';

@Injectable()
export class WebsocketUtils {
  constructor(
    private messageService: MessageService,
    private chatService: ChatService,
  ) {}

  sendError(client, err) {
    client.send(
      JSON.stringify({ event: 'error', data: { message: err.message } }),
    );
  }

  removeUserFromServerByUserId(server, userId) {
    for (const client of server.clients) {
      if (client['user'] && client['user']?.userId == userId)
        return client.close(1008, 'NewSignIn');
    }
  }

  sendResponseToUser(server: Server, wsClient, receiverId, event, data) {
    const receiver = [...server.clients].find(
      (client) => client['user']?.userId == receiverId,
    );
    if (wsClient['user']?.userId == receiverId) return;
    if (receiver) receiver.send(JSON.stringify({ event, data }));
  }

  sendResponseToClient(wsClient, event, data) {
    if (wsClient) wsClient.send(JSON.stringify({ event, data }));
  }

  sendResponseToUsers(server: Server, wsClient, userIds, event, data) {
    for (const client of server.clients) {
      if (
        client['user']?.userId != wsClient['user']?.userId &&
        userIds.includes(client['user']?.userId)
      ) {
        client.send(JSON.stringify({ event, data }));
      }
    }
  }

  async getUserChatIds(userId) {
    const chats = await this.chatService.getChats(+userId);
    return chats.map((chat) => chat.chatId);
  }

  async getChatsUsersIds(userId) {
    const chats = await this.chatService.getChats(+userId);
    const chatUserIds = chats.map((chat) => {
      if (chat?.user1?.userId == userId) return chat.user2.userId;
      return chat?.user1.userId;
    });
    return chatUserIds;
  }

  async getOnlineUsersFromList(server, userIds) {
    const onlineClients = [...server.clients].filter(
      (client) =>
        client['user']?.userId && userIds.includes(client['user'].userId),
    );
    const onlineUserIds = onlineClients.map((client) => client['user'].userId);

    return onlineUserIds;
  }

  async readMessagesInChat(userId, payload) {
    const { chatId } = payload;
    if (!chatId) return;
    const chat = await this.chatService.getChatById(chatId);
    if (chat) {
      await this.messageService.readMessagesInChat(chatId, userId);
      const secondUserId = this.getSecondUserIdOfChat(userId, chat);
      return { chatId, secondUserId };
    }
    throw new Error("Can't find chat!");
  }

  getSecondUserIdOfChat(clientUserId, chat) {
    if (
      chat &&
      (chat.user1.userId == clientUserId || chat.user2.userId == clientUserId)
    ) {
      if (chat.user1.userId == clientUserId) return chat.user2.userId;
      return chat.user1.userId;
    }
    return null;
  }

  async handleGetMessages(userId, payload) {
    const { chatId, lastMessageTimeCreated } = payload;
    const chat = await this.chatService.getChatById(chatId);
    if (chat && (chat.user1.userId == userId || chat.user2.userId == userId)) {
      const messages = await this.messageService.getMessages(
        chatId,
        lastMessageTimeCreated,
      );
      return messages;
    }
    return [];
  }

  async handleCreateMessage(userId, payload) {
    const { receiverId, content } = payload;
    if (!content) return;
    const newMessage = await this.messageService.createMessage(
      userId,
      receiverId,
      content,
    );
    return newMessage;
  }

  async handleEditMessage(userId, payload) {
    const { messageId, content } = payload;
    if (!content) return;
    const updatedMessage = await this.messageService.updateMessage(
      userId,
      messageId,
      content,
    );
    return updatedMessage;
  }

  async handleDeleteMessage(userId, payload) {
    const { messageId } = payload;
    const deletedMessage = await this.messageService.deleteMessage(
      userId,
      messageId,
    );
    return deletedMessage;
  }

  async getChatByChatId(userId, payload) {
    const { chatId } = payload;
    if (!chatId) return null;
    const chat = await this.chatService.getChatById(+chatId);
    if (!chat) return null;
    if (chat.user1.userId != userId && chat.user2.userId != userId) return null;
    return chat;
  }

  findClientByUserId(server, secondUserId) {
    const foundClient = [...server.clients].find(
      (item) => item['user'] && item['user'].userId == secondUserId,
    );
    return foundClient;
  }

  getUserFromChat(userId, chat) {
    return chat.user1.userId == userId ? chat.user1 : chat.user2;
  }

  // calls
  getSecondUserOfCall(userId, call) {
    return call.recipient.userId == userId
      ? call.recipient.userId
      : call.initiator.userId;
  }

  callNotExistHandle(server, client, callsMap, chat) {
    const secondUserId = this.getSecondUserIdOfChat(
      +client['user'].userId,
      chat,
    );
    const recipientClient = this.findClientByUserId(server, secondUserId);
    const newCall = {
      initiator: this.getUserFromChat(client['user'].userId, chat),
      recipient: this.getUserFromChat(secondUserId, chat),
      timeCallInitiated: new Date(),
      status: 'callInitiated',
    };
    callsMap.set(chat.chatId, newCall);
    this.sendResponseToClient(client, 'dialing', { call: newCall });
    this.sendResponseToClient(recipientClient, 'callInitiated', {
      chatId: chat.chatId,
      ...newCall,
    });
  }
  callExistHandle(server, client, call) {
    const initiatorClient = this.findClientByUserId(
      server,
      call.initiator.userId,
    );
    call.status = 'inProgress';
    this.sendResponseToClient(client, 'connectedToCall', { call });
    this.sendResponseToClient(initiatorClient, 'recipientAnswered', {
      status: call.status,
    });
  }

  callRejectHandle(server, callMap, call, chatId) {
    const initiatorClient = this.findClientByUserId(
      server,
      call.initiator.userId,
    );
    callMap.delete(chatId);
    this.sendResponseToClient(initiatorClient, 'callRejected', {
      status: 'rejected',
    });
  }

  callEndHandle(server, client, callMap, chat) {
    const secondUserId = this.getSecondUserIdOfChat(
      +client['user'].userId,
      chat,
    );
    const secondCallClient = this.findClientByUserId(server, secondUserId);
    callMap.delete(chat.chatId);
    this.sendResponseToClient(secondCallClient, 'callEnded', {
      chatId: chat.chatId,
      status: 'ended',
    });
  }

  async endAllCalls(server, client, callsMap) {
    const chatIds = await this.getUserChatIds(+client['user'].userId);
    const activeCallIds = this.findAllActiveUserCalls(callsMap, chatIds);
    console.log(activeCallIds);
    if (chatIds.length == 0) return;
    for (const callId of activeCallIds) {
      if (callId) {
        const call = callsMap.get(callId);
        if (!call) continue;
        const callSecondUserId = this.getSecondUserOfCall(
          client['user'].userId,
          call,
        );
        const callSecondClient = this.findClientByUserId(
          server,
          callSecondUserId,
        );
        this.sendResponseToClient(callSecondClient, 'callEnded', {
          chatId: callId,
          status: 'ended',
        });
        callsMap.delete(callId);
      }
    }
  }

  findAllActiveUserCalls(callsMap, chatIds) {
    const activeCallIds = [];
    for (const chatId of chatIds) {
      const call = callsMap.get(chatId);
      if (call) activeCallIds.push(chatId);
    }
    return activeCallIds;
  }

  callAnswerHandle(server, client, callsMap, chatId, chatIds) {
    const activeCallIds = this.findAllActiveUserCalls(callsMap, chatIds);
    for (const callId of activeCallIds) {
      if (callId != chatId) {
        const call = callsMap.get(callId);
        if (!call) continue;
        const callSecondUserId = this.getSecondUserOfCall(
          client['user'].userId,
          call,
        );
        const callSecondClient = this.findClientByUserId(
          server,
          callSecondUserId,
        );
        this.sendResponseToClient(callSecondClient, 'callEnded', {
          chatId,
          status: 'ended',
        });
        callsMap.delete(callId);
      }
    }
  }

  callRTCOfferHandle(server, client, callMap, chat, offer) {
    const secondUserId = this.getSecondUserIdOfChat(
      +client['user'].userId,
      chat,
    );
    const secondCallClient = this.findClientByUserId(server, secondUserId);
    this.sendResponseToClient(secondCallClient, 'offerCreated', {
      chatId: chat.chatId,
      offer,
    });
  }

  callRTCAnswerHandle(server, client, callMap, chat, answer) {
    const secondUserId = this.getSecondUserIdOfChat(
      +client['user'].userId,
      chat,
    );
    const secondCallClient = this.findClientByUserId(server, secondUserId);
    this.sendResponseToClient(secondCallClient, 'answerCreated', {
      chatId: chat.chatId,
      answer,
    });
  }

  iceCandidateHandle(server, client, callMap, chat, candidate) {
    const secondUserId = this.getSecondUserIdOfChat(
      +client['user'].userId,
      chat,
    );
    const secondCallClient = this.findClientByUserId(server, secondUserId);
    this.sendResponseToClient(secondCallClient, 'newIceCandidate', {
      chatId: chat.chatId,
      candidate,
    });
  }

  // getOnlineUsers(server: Server);
  // Define your utility functions here
  utilityFunction() {
    // Access the service methods using this.myService
    console.log('hello');
  }
}
