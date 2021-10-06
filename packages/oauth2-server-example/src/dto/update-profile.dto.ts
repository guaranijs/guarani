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
  readonly given_name: string

  @MaxLength(32)
  readonly middle_name?: string

  @MaxLength(64)
  @IsDefined()
  readonly family_name: string

  @MaxLength(32)
  readonly nickname?: string

  @MaxLength(32)
  readonly preferred_username?: string

  @IsDateString()
  @IsDefined()
  readonly birthdate: Date

  @ValidateIf((_, value) => value !== '')
  @IsIn(['M', 'F'])
  readonly gender?: string

  @IsEmail()
  @IsDefined()
  readonly email: string

  @IsMobilePhone('pt-BR')
  readonly phone_number?: string

  readonly street_address?: string

  readonly locality?: string

  readonly region?: string

  @IsPostalCode('BR')
  readonly postal_code?: string

  readonly country?: string

  public constructor(data: IUpdateProfileDto) {
    Object.assign(this, data)
  }
}
