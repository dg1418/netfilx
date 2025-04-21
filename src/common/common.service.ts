import { Injectable } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { PagePaginationDto } from './dto/page-pagination.dto';
import { CursorPaginationDto } from './dto/cursor-pagination.dto';

@Injectable()
export class CommonService {
  constructor() {}

  applyPagePaginationParamsToQb<T>(
    qb: SelectQueryBuilder<T>,
    dto: PagePaginationDto,
  ) {
    const { page, take } = dto;
    const skip = (page - 1) * take;

    qb.skip(skip);
    qb.take(take);
  }

  applyCursorPaginationParamsToQb<T>(
    qb: SelectQueryBuilder<T>,
    dto: CursorPaginationDto,
  ) {
    const { id, take, order } = dto;

    if (id) {
      qb.where(`${qb.alias}.id ${order === 'ASC' ? '>' : '<'} :id`, { id });
    }

    qb.orderBy(`${qb.alias}.id`, order);
    qb.take(take);
  }
}
