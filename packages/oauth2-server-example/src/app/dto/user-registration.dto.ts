import { Expose } from 'class-transformer';
import { IsDefined, IsEmail, IsPhoneNumber, Matches } from 'class-validator';

/**
 * Data Transfer Object of the User Registration.
 */
export class UserRegistrationDto {
  /**
   * Email of the User.
   */
  @Expose({ name: 'email' })
  @IsEmail(undefined, { message: 'Invalid email.' })
  @IsDefined({ message: 'The email must not be empty.' })
  public readonly email!: string;

  /**
   * Password of the User.
   */
  @Expose({ name: 'password' })
  @Matches(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[!@#$%&*\-_+=?^~]).{8,64}$/, {
    message:
      'The password must have between 8 and 64 characteres, upper and lower case letters, ' +
      'numbers and special characteres (!@#$%&*-_+=?^~)',
  })
  @IsDefined({ message: 'The password must not be empty.' })
  public readonly password!: string;

  /**
   * First or Given Name of the User.
   */
  @Expose({ name: 'given_name' })
  @Matches(/^(?=.*?[a-zA-Z])[a-zA-Z ]+$/, { message: 'The given name must only have letters and spaces.' })
  @IsDefined({ message: 'The given name must not be empty.' })
  public readonly given_name!: string;

  /**
   * Last or Family Name of the User.
   */
  @Expose({ name: 'family_name' })
  @Matches(/^(?=.*?[a-zA-Z])[a-zA-Z ]+$/, { message: 'The family name must only have letters and spaces.' })
  @IsDefined({ message: 'The family name must not be empty.' })
  public readonly family_name!: string;

  /**
   * Phone Number of the User.
   */
  @Expose({ name: 'phone_number' })
  @IsPhoneNumber(undefined, { message: 'Invalid phone number.' })
  @IsDefined({ message: 'The phone number must not be empty.' })
  public readonly phone_number!: string;

  /**
   * Birthdate of the User.
   */
  @Expose({ name: 'birthdate' })
  @Matches(/^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/, { message: 'Invalid birthdate.' })
  @IsDefined({ message: 'The birthdate must not be empty.' })
  public readonly birthdate!: string;

  /**
   * Address of the User.
   */
  @Expose({ name: 'address' })
  @IsDefined({ message: 'The address must not be empty.' })
  public readonly address!: string;
}
