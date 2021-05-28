export interface OAuth2User {
  getId(): string

  checkPassword?(password: string): Promise<boolean>
}
