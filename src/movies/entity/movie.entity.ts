import { Exclude, Expose, Transform } from 'class-transformer';
// 6강 클래스 transformer
export class Movie {
  id: number;

  title: string;

  //@Expose() // 노출하겠다. 디폴트인데 왜하나?
  // -> 클래스 자체에 @Exclude()로 노출을 없애고, 특정 값만 보여주고 싶을때
  // @Exclude() //직렬화, 역직렬화 할때, 이값을 노출하지 않겠다.

  @Transform(({ value }) => value.toString().toUpperCase())
  genre: string;
}
