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

  async applyCursorPaginationParamsToQb<T>(
    qb: SelectQueryBuilder<T>,
    dto: CursorPaginationDto,
  ) {
    const { cursor, take } = dto;
    let { orders } = dto;

    if (cursor) {
      const decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8');
      const cursorObj = JSON.parse(decodedCursor);

      orders = cursorObj.orders; // curor가 없을때 orders는 dto에서 가져옴. cursor가 있으면 orders는 cursor에 있는 값을 사용해야함.

      const { values } = cursorObj;
      /**
       * 내가 만들 커서 형태임
       * {
       *  values: {
       *    id: 1
       *  },
       *  orders: [ 'id_DESC' ]
       * }
       */

      // (movie.id) > (id) ,  1

      // 1. column
      // (movie.id)
      const columns = Object.keys(values); // 키이름의 문자열 배열을 출력함. // ["id"]

      const comparsionOperator = orders.some((orderString) =>
        orderString.endsWith('DESC'),
      )
        ? '<'
        : '>';

      // 2. operrator inteligent
      const whereConditions = columns
        .map((column) => `${qb.alias}.${column}`)
        .join(',');

      // 3. param
      // (id)
      const whereParmas = columns.map((column) => `:${column}`).join(',');

      qb.where(
        `(${whereConditions}) ${comparsionOperator} (${whereParmas})`,
        values,
      );
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

    const datas = await qb.getMany();
    const nextCursor = this.generateNextCursor(datas, orders);

    return { qb, nextCursor };
  }

  generateNextCursor<T>(results: T[], orders: string[]): string | null {
    /**
     * 내가 만들 커서 형태임
     * {
     *  values: {
     *    id: 1
     *  },
     *  orders: [ 'id_DESC' ]
     * }
     */

    if (results.length === 0) {
      return null; // null을 리턴하면 다음 커서가 없다는 의미 -> 다음 데이터가 없음
    }

    const lastItem = results[results.length - 1];
    const values = {};

    orders.forEach((order) => {
      const [column] = order.split('_');
      values[column] = lastItem[column];
    });

    const cursorObj = { values, orders };
    const nextCursor = Buffer.from(JSON.stringify(cursorObj)).toString(
      'base64',
    ); // 1. JSON.stringify로 객체를 문자열로 변환
    // 2. Buffer.from로 문자열을 버퍼로 변환
    // 3. toString('base64')로 버퍼를 base64로 인코딩

    return nextCursor;
  }
}
