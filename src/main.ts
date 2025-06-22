import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: true, // или нужный фронтенд-адрес
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
