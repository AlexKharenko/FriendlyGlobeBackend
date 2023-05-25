import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './modules/app.module';
import { ValidationPipe } from '@nestjs/common';
import fastifyMultipart from '@fastify/multipart';
import cookie from '@fastify/cookie';
import * as fastifyStatic from '@fastify/static';
import { join, dirname } from 'path';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  app.enableCors({
    origin: [
      'http://localhost:8080',
      'http://192.168.1.6:8080',
      'http://192.168.43.126:8080',
      'http://192.168.1.56:8080',
      process.env.FRONT_END_URL,
    ],
    credentials: true,
  });
  app.register(fastifyStatic, {
    root: join(dirname(dirname(__dirname)), 'public', 'uploads'),
    prefix: '/static/',
  });
  app.useWebSocketAdapter(new WsAdapter(app));
  await app.register(cookie);
  await app.register(fastifyMultipart);
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
}
bootstrap();
