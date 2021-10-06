import { validateOrReject } from 'class-validator'
import { Request, Response } from 'express'

import { UpdateProfileDto } from '../../dto'
import { User } from '../../entities'

class Controller {
  public async index(request: Request, response: Response) {
    return response.render('auth/profile', {
      title: 'Profile',
      user: request.user
    })
  }

  public async editProfile(request: Request, response: Response) {
    return response.render('auth/profile/edit', {
      title: 'Edit Profile',
      user: request.user,
      csrf: request.csrfToken()
    })
  }

  public async doEditProfile(request: Request, response: Response) {
    const dto = new UpdateProfileDto(request.body)

    try {
      await validateOrReject(dto, { skipMissingProperties: true })
    } catch (errors) {
      console.log(errors)

      return response.render('auth/profile/edit', {
        title: 'Edit Profile',
        user: request.user,
        csrf: request.csrfToken(),
        errors
      })
    }

    const user = <User>request.user

    user.givenName = dto.given_name || null
    user.middleName = dto.middle_name || null
    user.familyName = dto.family_name || null
    user.nickname = dto.nickname || null
    user.preferredUsername = dto.preferred_username || null
    user.emailVerified = dto.email === user.email ? user.emailVerified : false
    user.email = dto.email || null
    user.gender = dto.gender || null
    user.birthdate = dto.birthdate || null
    user.phoneNumberVerified =
      dto.phone_number === user.phoneNumber ? user.phoneNumberVerified : false
    user.phoneNumber = dto.phone_number || null
    user.address.streetAddress = dto.street_address || null
    user.address.locality = dto.locality || null
    user.address.region = dto.region || null
    user.address.postalCode = dto.postal_code || null
    user.address.country = dto.country || null

    // TODO: Display the errors at the HTML page.
    try {
      await user.save()
    } catch (errors) {
      return response.render('auth/profile/edit', {
        title: 'Edit Profile',
        user: request.user,
        csrf: request.csrfToken(),
        error: 'An error occurred. Please try again.'
      })
    }

    return response.redirect(303, '/auth/profile')
  }
}

export const ProfileController = new Controller()
