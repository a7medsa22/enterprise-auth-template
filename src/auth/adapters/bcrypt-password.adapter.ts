import { Injectable } from "@nestjs/common";
import bcrypt from 'bcrypt';
import { PasswordServicePort } from "../interfaces/password.interface";

@Injectable()
export class BcryptPasswordAdapter implements PasswordServicePort  {
    
      private readonly rounds = 10;
    
      async hash(password: string): Promise<string> {
        return bcrypt.hash(password, this.rounds);
      }
      
      async compare(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
      }
    }

    
