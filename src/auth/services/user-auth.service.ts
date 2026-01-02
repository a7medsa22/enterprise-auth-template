import { Injectable } from "@nestjs/common";
import { UsersService } from "src/users/users.service";

@Injectable()
export class UserAuthService {
  constructor(private readonly usersService: UsersService) {}

  async findByEmail(email: string) {
    return this.usersService.findByEmail(email);
  }

  async createUser(data: {
    email: string;
    password: string;
  }) {
    return this.usersService.create(data);
  }
}
