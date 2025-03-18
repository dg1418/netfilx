import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 6강, vaildation을 하기 위해서는 기본적으로 글로벌 파이프에 vaildattion pipe 를 넣어야한다.
  app.useGlobalPipes(new ValidationPipe());

  await app.listen(3000);
}
bootstrap();
