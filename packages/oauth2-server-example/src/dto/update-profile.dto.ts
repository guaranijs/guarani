import {
  IsDateString,
  IsDefined,
  IsEmail,
  IsIn,
  IsMobilePhone,
  IsPostalCode,
  MaxLength,
  ValidateIf
} from 'class-validator'

interface IUpdateProfileDto {
  readonly given_name: string
  readonly middle_name?: string
  readonly family_name: string
  readonly nickname?: string
  readonly preferred_username?: string
  readonly birthdate: string
  readonly gender?: string
  readonly email: string
  readonly phone_number?: string
  readonly street_address?: string
  readonly locality?: string
  readonly region?: string
  readonly postal_code?: string
  readonly country?: string
}

export class UpdateProfileDto {
  @MaxLength(16)
  @IsDefined()
  public readonly given_name: string

  @MaxLength(32)
  public readonly middle_name?: string

  @MaxLength(64)
  @IsDefined()
  public readonly family_name: string

  @MaxLength(32)
  public readonly nickname?: string

  @MaxLength(32)
  public readonly preferred_username?: string

  @IsDateString()
  @IsDefined()
  public readonly birthdate: Date

  @ValidateIf((_, value) => value !== '')
  @IsIn(['M', 'F'])
  public readonly gender?: string

  @IsEmail()
  @IsDefined()
  public readonly email: string

  @IsMobilePhone('pt-BR')
  public readonly phone_number?: string

  @ValidateIf((_, value) => value !== '')
  public readonly street_address?: string

  @ValidateIf((_, value) => value !== '')
  public readonly locality?: string

  @ValidateIf((_, value) => value !== '')
  public readonly region?: string

  @ValidateIf((_, value) => value !== '')
  @IsPostalCode('BR')
  public readonly postal_code?: string

  @ValidateIf((_, value) => value !== '')
  public readonly country?: string

  public constructor(data: IUpdateProfileDto) {
    Object.assign(this, data)
  }
}
