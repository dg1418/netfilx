import { Module } from '@nestjs/common';
import { MoviesModule } from './movies/movies.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        ENV: Joi.string().valid('dev', 'prod').required(),
        DB_TYPE: Joi.string().valid('postgres').required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
      }),
    }),
    TypeOrmModule.forRoot({
      type: process.env.DB_TYPE as 'postgres', // config모듈이 아닌 기존 nodejs의 환경설정 방법
      host: process.env.DB_HOST,
      port: 5555,
      username: 'postgres',
      password: 'postgres',
      database: 'postgres',
      entities: [], // typeorm 리포클래스들을 넣어서 설정하나봄
      synchronize: true, // entity를 보고 테이블을 구성하잖아? entitiy 변경되면 자동 마이그레인션 하는 옵션 ㄷㄷ
      // 개발환경에서만 true로 하고 실제 환경에서는 false로 하기
    }),
    MoviesModule,
  ],
})
export class AppModule {}
