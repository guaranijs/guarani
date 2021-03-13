/* eslint-disable no-redeclare */

import { readFileSync } from 'fs'
import { join } from 'path'

import { JWKAParams } from '../lib/jwa'

export function loadSymmetricKey<T extends JWKAParams>(
  kty: string,
  ext: 'json'
): T
export function loadSymmetricKey(kty: string, ext: 'pem'): string
export function loadSymmetricKey<T extends JWKAParams>(
  kty: string,
  ext: 'json' | 'pem'
): T | string {
  const secretKey = readFileSync(
    join(__dirname, 'keys', `${kty.toLowerCase()}_secret_key.${ext}`),
    { encoding: 'utf-8' }
  )

  return ext === 'json' ? JSON.parse(secretKey) : secretKey
}

export function loadAsymmetricKey<T extends JWKAParams>(
  kty: string,
  ext: 'json',
  keyType: 'public'
): T
export function loadAsymmetricKey<T extends JWKAParams>(
  kty: string,
  ext: 'json',
  keyType: 'private'
): T
export function loadAsymmetricKey(
  kty: string,
  ext: 'pem',
  keyType: 'public'
): string
export function loadAsymmetricKey(
  kty: string,
  ext: 'pem',
  keyType: 'private'
): string
export function loadAsymmetricKey<T extends JWKAParams>(
  kty: string,
  ext: 'json' | 'pem',
  keyType: 'public' | 'private'
): T | string {
  const key = readFileSync(
    join(__dirname, 'keys', `${kty.toLowerCase()}_${keyType}_key.${ext}`),
    { encoding: 'utf-8' }
  )

  return ext === 'json' ? JSON.parse(key) : key
}
