import { IsEmail, Matches } from 'class-validator';

export class CreateUserDto {
  @Matches(/^[a-zA-Z0-9\-_]{8,16}$/, {
    message:
      'The username must contain between 8 and 16 characteres with lower and uppercase chars, numbers, hyphen and underscore.',
  })
  public readonly username!: string;

  @IsEmail(undefined, { message: 'Invalid Email.' })
  public readonly email!: string;

  @Matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[?!@#$%^&*\-_]).{8,}$/, {
    message:
      'The password must contain be at least 8 characteres, with at least 1 lowercase char, 1 uppercase char, 1 number and 1 special char.',
  })
  public readonly password!: string;
}
