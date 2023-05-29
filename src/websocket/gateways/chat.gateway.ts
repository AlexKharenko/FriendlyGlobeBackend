import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { TokenService } from 'src/services/token.service';
import { cookieParse } from 'src/utils/cookieParser';
import { Server, WebSocket } from 'ws';
import { WebsocketUtils } from 'src/utils/websocket.util';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway {
  @WebSocketServer() server: Server;

  callsMap = new Map();
  constructor(
    private websocketUtils: WebsocketUtils,
    private tokenService: TokenService,
  ) {}

  async validateToken(token: string) {
    try {
      return await this.tokenService.validateAccessToken(token);
    } catch (e) {
      return false;
    }
  }

  async validateClient(client, cookies) {
    if (!cookies?.accessToken) {
      client.close(1008, 'Unauthorized');
      return false;
    }
    const payload = await this.validateToken(cookies.accessToken);
    if (!payload || !payload.verified || payload.blocked) {
      client.close(1008, 'Forbidden');
      return false;
    }
    this.websocketUtils.removeUserFromServerByUserId(
      this.server,
      payload.userId,
    );
    client['user'] = payload;
    return true;
  }

  async handleConnection(client: WebSocket, req) {
    const cookieHeader = req.headers.cookie;
    const cookies = cookieParse(cookieHeader);
    const result = await this.validateClient(client, cookies);
    if (!result) return;

    const chatsUserIds = await this.websocketUtils.getChatsUsersIds(
      client['user'].userId,
    );
    this.websocketUtils.sendResponseToUsers(
      this.server,
      client,
      chatsUserIds,
      'userWentOnline',
      { userId: client['user'].userId },
    );
  }

  async handleDisconnect(client: WebSocket) {
    try {
      if (client['user']) {
        const chatsUserIds = await this.websocketUtils.getChatsUsersIds(
          client['user'].userId,
        );
        this.websocketUtils.sendResponseToUsers(
          this.server,
          client,
          chatsUserIds,
          'userWentOffline',
          { userId: client['user'].userId },
        );
        await this.websocketUtils.endAllCalls(
          this.server,
          client,
          this.callsMap,
        );
        return;
      }
    } catch (err) {
      console.log(err);
    }
  }

  @SubscribeMessage('removeChatForUser')
  async handleBlackListUser(client: WebSocket, payload) {
    if (payload.userId)
      this.websocketUtils.sendResponseToUser(
        this.server,
        client,
        payload.userId,
        'removeChat',
        { userId: client['user'].userId },
      );
  }

  @SubscribeMessage('userCreatedChat')
  async handleUserCreatedChat(client: WebSocket, payload) {
    if (payload.chat) {
      const secondUserId = this.websocketUtils.getSecondUserIdOfChat(
        client['user'].userId,
        payload.chat,
      );
      this.websocketUtils.sendResponseToUser(
        this.server,
        client,
        secondUserId,
        'newChat',
        { chat: payload.chat },
      );
    }
  }

  @SubscribeMessage('getOnlineUsers')
  async handleGetOnlineUsers(client: WebSocket) {
    const chatsUserIds = await this.websocketUtils.getChatsUsersIds(
      client['user'].userId,
    );
    const onlineUserIds = await this.websocketUtils.getOnlineUsersFromList(
      this.server,
      chatsUserIds,
    );
    const data = { onlineUsers: onlineUserIds };
    this.websocketUtils.sendResponseToClient(client, 'onlineUsers', data);
  }

  @SubscribeMessage('readMessagesInChat')
  async handleReadMessagesInChat(client: WebSocket, payload) {
    try {
      const { chatId, secondUserId } =
        await this.websocketUtils.readMessagesInChat(
          client['user'].userId,
          payload,
        );

      const data = {
        chatId,
        receiverId: client['user'].userId,
      };
      this.websocketUtils.sendResponseToClient(client, 'messagesRead', data);
      this.websocketUtils.sendResponseToUser(
        this.server,
        client,
        secondUserId,
        'messagesRead',
        data,
      );
    } catch (err) {
      if (err.message == "Can't find chat!")
        return this.websocketUtils.sendResponseToClient(
          client,
          'noChatWithSuchReceiver',
          {
            chatId: payload?.chatId,
          },
        );
      this.websocketUtils.sendError(client, err);
    }
  }

  @SubscribeMessage('getMessages')
  async handleGetMessages(client: WebSocket, payload) {
    const messages = await this.websocketUtils.handleGetMessages(
      client['user'].userId,
      payload,
    );
    const data = { messages };
    this.websocketUtils.sendResponseToClient(
      client,
      payload.first ? 'firstMessages' : 'moreMessages',
      data,
    );
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(client: WebSocket, payload) {
    try {
      const newMessage = await this.websocketUtils.handleCreateMessage(
        client['user'].userId,
        payload,
      );
      if (newMessage) {
        const data = { newMessage };
        this.websocketUtils.sendResponseToUser(
          this.server,
          client,
          payload.receiverId,
          'newMessage',
          data,
        );
        this.websocketUtils.sendResponseToClient(
          client,
          'messageCreated',
          data,
        );
      } else {
        this.websocketUtils.sendResponseToClient(client, 'alertMessage', {
          message: 'Failed to send new message!',
        });
      }
    } catch (err) {
      if (err.message == "Can't find chat!")
        return this.websocketUtils.sendResponseToClient(
          client,
          'noChatWithSuchReceiver',
          {
            receiverId: payload.receiverId,
          },
        );
      this.websocketUtils.sendError(client, err);
    }
  }

  @SubscribeMessage('editMessage')
  async handleEditMessage(client: WebSocket, payload) {
    try {
      const updatedMessage = await this.websocketUtils.handleEditMessage(
        client['user'].userId,
        payload,
      );
      if (updatedMessage) {
        const data = { updatedMessage };
        this.websocketUtils.sendResponseToUser(
          this.server,
          client,
          updatedMessage.receiverId,
          'messageEdited',
          data,
        );
        this.websocketUtils.sendResponseToClient(client, 'messageEdited', data);
      } else {
        this.websocketUtils.sendResponseToClient(client, 'alertMessage', {
          message: 'Failed to edit message!',
        });
      }
    } catch (err) {
      if (err.message == "Can't find chat!")
        return this.websocketUtils.sendResponseToClient(
          client,
          'noChatWithSuchReceiver',
          {
            receiverId: payload.receiverId,
          },
        );
      if (err.message == 'No message found!')
        return this.websocketUtils.sendResponseToClient(
          client,
          'alertMessage',
          {
            message: err.message,
          },
        );
      if (err.message == 'Only sender can change the message!')
        return this.websocketUtils.sendResponseToClient(
          client,
          'alertMessage',
          {
            message: err.message,
          },
        );
      this.websocketUtils.sendError(client, err);
    }
  }

  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(client: WebSocket, payload) {
    try {
      const deletedMessage = await this.websocketUtils.handleDeleteMessage(
        client['user'].userId,
        payload,
      );
      if (deletedMessage) {
        const data = { deletedMessage };
        this.websocketUtils.sendResponseToUser(
          this.server,
          client,
          deletedMessage.receiverId,
          'messageDeleted',
          data,
        );
        this.websocketUtils.sendResponseToClient(
          client,
          'messageDeleted',
          data,
        );
      } else {
        this.websocketUtils.sendResponseToClient(client, 'alertMessage', {
          message: 'Failed to edit message!',
        });
      }
    } catch (err) {
      if (err.message == "Can't find chat!")
        return this.websocketUtils.sendResponseToClient(
          client,
          'noChatWithSuchReceiver',
          {
            receiverId: payload.receiverId,
          },
        );
      if (err.message == 'No message found!')
        return this.websocketUtils.sendResponseToClient(
          client,
          'alertMessage',
          {
            message: err.message,
          },
        );
      if (err.message == 'You can not delete not your own messages!')
        return this.websocketUtils.sendResponseToClient(
          client,
          'alertMessage',
          {
            message: err.message,
          },
        );
      this.websocketUtils.sendError(client, err);
    }
  }

  // Calling logic
  @SubscribeMessage('callEnter')
  async handleCallEnter(client: WebSocket, payload) {
    const chat = await this.websocketUtils.getChatByChatId(
      +client['user'].userId,
      payload,
    );
    if (!chat)
      return this.websocketUtils.sendResponseToClient(
        client,
        'noChatFound',
        {},
      );
    const call = this.callsMap.get(chat.chatId);

    if (call && client['user'].userId == call.initiator.userId) {
      this.callsMap.delete(chat.chatId);
    }
    if (call) {
      return this.websocketUtils.callExistHandle(this.server, client, call);
    } else {
      return this.websocketUtils.callNotExistHandle(
        this.server,
        client,
        this.callsMap,
        chat,
      );
    }
  }

  @SubscribeMessage('answerCall')
  async handleAnswerCall(client: WebSocket, payload) {
    const chatIds = await this.websocketUtils.getUserChatIds(
      +client['user'].userId,
    );
    if (chatIds.length == 0 || !payload?.chatId) return;
    this.websocketUtils.callAnswerHandle(
      this.server,
      client,
      this.callsMap,
      payload.chatId,
      chatIds,
    );
  }

  @SubscribeMessage('rejectCall')
  async handleRejectCall(client: WebSocket, payload) {
    const chat = await this.websocketUtils.getChatByChatId(
      +client['user'].userId,
      payload,
    );
    if (!chat) return;
    const call = this.callsMap.get(chat.chatId);
    if (!call) return;
    this.websocketUtils.callRejectHandle(
      this.server,
      this.callsMap,
      call,
      chat.chatId,
    );
  }

  @SubscribeMessage('endCall')
  async handleEndCall(client: WebSocket, payload) {
    const chat = await this.websocketUtils.getChatByChatId(
      +client['user'].userId,
      payload,
    );
    if (!chat)
      return this.websocketUtils.sendResponseToClient(client, 'forbidden', {});
    const call = this.callsMap.get(chat.chatId);
    if (!call)
      return this.websocketUtils.sendResponseToClient(client, 'forbidden', {});
    this.websocketUtils.callEndHandle(this.server, client, this.callsMap, chat);
  }

  @SubscribeMessage('toggleVideo')
  async handleToggleVideo(client: WebSocket, payload) {
    const chat = await this.websocketUtils.getChatByChatId(
      +client['user'].userId,
      payload,
    );
    if (!chat) return;
    const call = this.callsMap.get(chat.chatId);
    if (!call) return;
    this.websocketUtils.toggleVideoHandle(this.server, client, payload, call);
  }

  @SubscribeMessage('callOffer')
  async handleCallOffer(client: WebSocket, payload) {
    const chat = await this.websocketUtils.getChatByChatId(
      +client['user'].userId,
      payload,
    );
    if (!chat)
      return this.websocketUtils.sendResponseToClient(client, 'forbidden', {});
    const call = this.callsMap.get(chat.chatId);
    if (!call)
      return this.websocketUtils.sendResponseToClient(client, 'forbidden', {});

    this.websocketUtils.callRTCOfferHandle(
      this.server,
      client,
      this.callsMap,
      chat,
      payload.offer,
    );
  }

  @SubscribeMessage('callAnswer')
  async handleAnswerOffer(client: WebSocket, payload) {
    const chat = await this.websocketUtils.getChatByChatId(
      +client['user'].userId,
      payload,
    );
    if (!chat)
      return this.websocketUtils.sendResponseToClient(client, 'forbidden', {});
    const call = this.callsMap.get(chat.chatId);
    if (!call)
      return this.websocketUtils.sendResponseToClient(client, 'forbidden', {});

    this.websocketUtils.callRTCAnswerHandle(
      this.server,
      client,
      this.callsMap,
      chat,
      payload.answer,
    );
  }

  @SubscribeMessage('iceCandidate')
  async handleIceCandidate(client: WebSocket, payload) {
    const chat = await this.websocketUtils.getChatByChatId(
      +client['user'].userId,
      payload,
    );
    if (!chat)
      return this.websocketUtils.sendResponseToClient(client, 'forbidden', {});
    const call = this.callsMap.get(chat.chatId);
    if (!call)
      return this.websocketUtils.sendResponseToClient(client, 'forbidden', {});
    this.websocketUtils.iceCandidateHandle(
      this.server,
      client,
      this.callsMap,
      chat,
      payload.candidate,
    );
  }
}
