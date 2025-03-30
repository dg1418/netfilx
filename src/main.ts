import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 6강, vaildation을 하기 위해서는 기본적으로 글로벌 파이프에 vaildattion pipe 를 넣어야한다.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 정의하지 않은 속성이 들어오면 dto에서 그 속성 키 없앰, 기본은 false,
      forbidNonWhitelisted: true, // 정의하지 않은 속성이 들어오면 에러도 던짐 ,기본은 false
      transformOptions: {
        // 이부분이 언제 추가되었는지 모르겠음. 깃허브 코드 추가한거라. 나중에 확인
        enableImplicitConversion: true,
      },
    }),
  );

  await app.listen(3000);
}
bootstrap();
