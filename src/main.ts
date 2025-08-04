import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.HEADER,
    header: 'version',
  });

  const config = new DocumentBuilder()
    .setTitle('NETFLIX')
    .setDescription('코드팩토리 NestJS 강의 공부하기')
    .setVersion('1.0')
    .addGlobalParameters({
      name: 'version',
      in: 'header',
      description: 'API 버전',
      required: true,
      schema: {
        type: 'string',
        default: '2',
      },
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc', app, document);

  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  // 6강, vaildation을 하기 위해서는 기본적으로 글로벌 파이프에 vaildattion pipe 를 넣어야한다.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 정의하지 않은 속성이 들어오면 dto에서 그 속성 키 없앰, 기본은 false,
      forbidNonWhitelisted: true, // 정의하지 않은 속성이 들어오면 에러도 던짐 ,기본은 false
      transformOptions: {
        enableImplicitConversion: true, // 페이지네이션에서 추가된 코드, 쿼리에서 넘버릭 스트링을 변환해줌
      },
    }),
  );

  await app.listen(3000);
}
bootstrap();
