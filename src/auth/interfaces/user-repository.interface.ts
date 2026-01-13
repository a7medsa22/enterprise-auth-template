import { Role } from "../enums/role.enum";
import { User } from "./user.interface";

export interface UserRepositoryPort  {

   findByEmail(email: string): Promise<User | null>; 
   create(userData:{email: string, password: string,roles:Role}): Promise<User>;

}
