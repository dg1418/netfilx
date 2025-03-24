import {
  IsNotEmpty,
  IsOptional,
  // registerDecorator,
  // Validate,
  // ValidationArguments,
  // ValidationOptions,
  // ValidatorConstraint,
  // ValidatorConstraintInterface,
} from 'class-validator';

// 6강 커스텀 발리데이터 만들기
// 1. ValidatorConstraintInterface 를 implements 받은 후 인터페이스 구현
// 2. validate 메서드에서 작동할 로직 구현, defaultMessage에 기본 에러 메시지 작성
// 3. 발리데이터로 사용할려면 @ValidatorConstraint() 데코레이터를 클래스에 달아야함
// 요기까지 하면  @Validate(PasswordValidator) 이런 형태로 Validate데코레이터에 커스텀 데코레이터 클래스를 넣어서
// 사용할 수 있다.
// 9. 추가로 @ValidatorConstraint()에 { async: true } 같은 비동기실행 옵션을 넣을수 있음 이걸로, 네트워크
// 요청 등을 추가 할 수 있을듯
// @ValidatorConstraint()
// class PasswordValidator implements ValidatorConstraintInterface {
//   validate(
//     value: any,
//     validationArguments?: ValidationArguments,
//   ): Promise<boolean> | boolean {
//     return value.length > 4 && value.length < 8;
//   }
//   defaultMessage?(validationArguments?: ValidationArguments): string {
//     return '비밀번호의 길이는 4~8자 이어야함';
//   }
// }

// 4. 내 커스텀 발리데이터 데코레이터 만들기
// 5. 함수하나 만들고 ValidationOptions 인터페이스 타입의 변수를 받아야함
// 6. 리턴으로 함수를 하나리턴하는데, 그함수에서는 registerDecorator() 함수를 실행후 리턴해야함
// 7. registerDecorator 함수에 객체로 아래와 같은 옵션들이 들어가야함
// 8. 이제 @IsPasswordValid() 이라는 발리데이션 데코레이터를 사용할 수 있음
// function IsPasswordValid(validationOptions?: ValidationOptions) {
//   return function (object: Object, propertyName: string) {
//     return registerDecorator({
//       target: object.constructor,
//       propertyName,
//       options: validationOptions,
//       validator: PasswordValidator,
//     });
//   };
// }

export class UpdateMovieDto {
  @IsNotEmpty() // 값이 비어있을 수 없다.
  @IsOptional() // title 속성은 있을 수 도 있고 없을 수도 있다. => title이 없을 수 있지만 있다면, 비어있을 수 없음
  title?: string;

  @IsNotEmpty()
  @IsOptional()
  genre?: string;

  // @IsDefined() // 정의가 됬는지, null || undefined 안됨
  // @IsOptional() // 값이 정의가 안되있으면, 다른 발리데이터를 실행을 안시킴
  // @Equals('coko') // 안의 내용과 같아야함
  // @NotEquals('coko') // 안의 내용과 달라야함
  // @IsEmpty() // null || undefined || '' (Empty string) 이 셋중 하나여야함
  // @IsNotEmpty() // null || undefined || '' 이면 안됨
  // @IsIn(['액션', '판타지']) // 배열안의 값 중 하나여야함
  // @IsNotIn(['액션', '판타지'])
  // @IsBoolean() // 불리언인지
  // @IsInt() // 정수인지
  // @IsNumber() // 숫자인지
  // @IsArray() // 배열인지
  // @IsEnum() // 이넘인지
  // @IsDateString() // 날짜 문자열타입인지
  // @IsDivisibleBy(5) // 5로 나눠지는지
  // @IsPositive() // 양수 인가?           @@바로사용할 수 있을듯
  // @IsNegative() 음수인가?
  // @Max(10) // 숫자 10까지
  // @Min(1) // 숫자 1 이상
  // @Contains("판타지") // 문자열에 "판타지"가 포함되어야함 "완전 판타지 어드밴쳐" 이런거야함
  // @NotContains("판타지") // 문자열에 "판타지" 라는 문자가 없어야함
  // @IsCreditCard() // 0000-0000-0000-0000 형태인지 확인함. 존재할수 없는 카드형태인지도 체크함
  // @IsHexColor() // FFEFFF 이런 컬러문자열 인지
  // @MaxLength(10) // 문자열 길이 맥스
  // @MinLength(1) // 문자열 길이 민
  // @IsUUID() // uuid 형태인지 확인
  // @Validate(PasswordValidator,{ message: '다른 메시지' }) // 커스텀 발리데이터 기본
  // @IsPasswordValid({ message: '다른 메시지' }) // 커스텀 데코까지 적용
  // test?: string;
}
