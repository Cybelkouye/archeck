export class UserRepository {}
export class EmailService {}
export class PaymentService {}

export class UserService {
  constructor(
    private repo: UserRepository,
    private email: EmailService,
    private payment: PaymentService
  ) {}
}
