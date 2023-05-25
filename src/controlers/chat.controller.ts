import {
  Controller,
  Get,
  UseGuards,
  Param,
  Req,
  Post,
  Body,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from 'src/guards/auth.guard';
// import { parseBool } from 'src/utils/parseBool';
// import { parseArray } from 'src/utils/parseArray';
// import { AdminGuard } from 'src/guards/admin.guard';
// import { VerifiedGuard } from 'src/guards/verified.guard';
import { BlockedGuard } from 'src/guards/blocked.guard';
import { VerifiedGuard } from 'src/guards/verified.guard';
import { ChatService } from 'src/services/chat.service';

@Controller('/chats')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @UseGuards(AuthGuard, VerifiedGuard, BlockedGuard)
  @Get('/')
  async getChats(@Req() req) {
    const chats = await this.chatService.getChats(req.payload.userId);

    return { success: true, chats };
  }

  @UseGuards(AuthGuard, BlockedGuard)
  @Post('/')
  async createChat(@Req() req, @Body() body) {
    const { newFriendUserId } = body;
    if (req.payload.userId == +newFriendUserId)
      throw new BadRequestException('You can`t create chat with yourself');
    const chat = await this.chatService.createChat(
      req.payload.userId,
      +newFriendUserId,
    );

    return { success: true, chat };
  }

  @UseGuards(AuthGuard, BlockedGuard)
  @Delete('/:chatId')
  async deleteChat(@Req() req, @Param('chatId') chatId) {
    await this.chatService.deleteChatByChatId(+chatId);

    return { success: true };
  }
}
