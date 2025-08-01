import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { readdir, unlink } from 'fs/promises';
import { join, parse } from 'path';
import { DefaultLogger } from './logger/default.logger';

@Injectable()
export class TasksService {
  // private readonly logger = new Logger(TasksService.name);
  constructor(private readonly logger: DefaultLogger) {}

  // @Cron('*/5 * * * * *')
  logEverySecond() {
    this.logger.fatal('fatal: 이것은 치명적인 에러 메시지입니다.');
    this.logger.error('error: 이것은 에러 메시지입니다.');
    this.logger.warn('warn: 이것은 경고 메시지입니다.');
    this.logger.log('log: 일반적인 로그 메시지입니다.');
    this.logger.debug('debug: 이것은 디버그 메시지입니다.');
    this.logger.verbose('verbose: 이것은 자세한 로그 메시지입니다.');
  }

  //@Cron('* * * * * *')
  async eraseOrphanTempFiles() {
    const tempFiles = await readdir(join(process.cwd(), 'public', 'temp'));

    const deletedFiles = tempFiles.filter((file) => {
      const filename = parse(file).name;

      // filename예시: 15f7b996-74c1-4757-bf9e-00352109c059_1753520645048
      const split = filename.split('_');
      if (split.length !== 2) {
        return true;
      }

      try {
        const now = Date.now();
        const fileTimestamp = +new Date(Number(split[split.length - 1]));
        const aDayInMs = 24 * 60 * 60 * 1000;

        return now - fileTimestamp > aDayInMs;
      } catch (e) {
        return true;
      }
    });

    await Promise.all(
      deletedFiles.map((file) => {
        unlink(join(process.cwd(), 'public', 'temp', file));
      }),
    );
  }
}
