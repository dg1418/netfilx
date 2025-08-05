import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CursorPaginationDto {
  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '페이지네이션 커서',
    example: 'eyJ2YWx1ZXMiOnsiaWQiOjl9LCJvcmRlcnMiOlsiaWRfREVTQyJdfQ==',
  })
  readonly cursor?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @ApiProperty({
    description: '페이지당 아이템 수',
    example: 5,
  })
  readonly take?: number = 5;

  @IsOptional()
  @IsString({
    each: true,
  })
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @ApiProperty({
    description: '오름차순 또는 내림차순 정렬',
    example: ['id_DESC'],
  })
  readonly orders?: string[] = ['id_DESC'];
}
