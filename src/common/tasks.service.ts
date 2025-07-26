import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class TasksService {
  constructor() {}

  @Cron('* * * * * *')
  logEverySecond() {
    console.log('매 초 실행');
  }
}
