import { User } from '../interfaces/user.interface';
import { UserRepositoryPort } from '../interfaces/user-repository.interface';
import { PasswordServicePort } from '../interfaces/password.interface';
import { Role } from '../enums/role.enum';

export class AuthDomainService  {
  constructor(
    private readonly userRepo: UserRepositoryPort,
    private readonly passwordService: PasswordServicePort,
  ) { }



  async registerDomain(email: string, password: string): Promise<User> {
    const hash = await this.passwordService.hash(password);

    return this.userRepo.create({
      email,
      password: hash,
      
    });

  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepo.findByEmail(email);

    if (!user) return null;
    if (!user.isActive) return null;

    const isValid = await this.passwordService.compare(password, user.password);

    return isValid ? user : null;
  }

}
