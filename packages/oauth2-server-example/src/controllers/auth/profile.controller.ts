import { validateOrReject } from 'class-validator'
import { Request, Response } from 'express'
import { getRepository } from 'typeorm'

import { UpdateProfileDto } from '../../dto/update-profile.dto'
import { Address, User } from '../../entities'

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
      return response.render('auth/profile/edit', {
        title: 'Edit Profile',
        user: request.user,
        csrf: request.csrfToken(),
        errors
      })
    }

    const userRepository = getRepository(User)

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

    if (user.address == null) {
      user.address = new Address()
    }

    user.address.streetAddress = dto.street_address || null
    user.address.locality = dto.locality || null
    user.address.region = dto.region || null
    user.address.postalCode = dto.postal_code || null
    user.address.country = dto.country || null

    // TODO: Display the errors at the HTML page.
    try {
      await userRepository.save(user)
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
