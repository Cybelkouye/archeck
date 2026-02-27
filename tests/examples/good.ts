export interface IUserRepo {}
export interface IEmailService {}

export class UserService {
  constructor(private repo: IUserRepo, private email: IEmailService) {}
}
