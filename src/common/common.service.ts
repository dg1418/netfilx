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
    const { cursor, take, orders } = dto;

    if (cursor) {
      //qb.where(`${qb.alias}.id ${order === 'ASC' ? '>' : '<'} :id`, { id });
    }

    orders.reduce((isFirstOrderBy, order) => {
      const [column, direction] = order.split('_');

      if (isFirstOrderBy) {
        qb.orderBy(`${qb.alias}.${column}`, direction as 'ASC' | 'DESC');
      } else {
        qb.addOrderBy(`${qb.alias}.${column}`, direction as 'ASC' | 'DESC');
      }

      return false;
    }, true);

    qb.take(take);
  }
}
