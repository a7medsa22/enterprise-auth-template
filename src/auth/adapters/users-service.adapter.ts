import { Injectable } from "@nestjs/common";
import { UsersService } from "src/users/users.service";
import { UserRepositoryPort } from "../interfaces/user-repository.interface";

@Injectable()
export class UsersServiceAdapter implements UserRepositoryPort {
  constructor(private readonly usersService: UsersService) {}

  async findByEmail(email: string) {
    return this.usersService.findByEmail(email);
  }

  async create(data: {
    email: string;
    password: string;
  }) {
    return this.usersService.create(data);
  }
}
