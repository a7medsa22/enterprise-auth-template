import { Result } from "../../shared/utils/Result";

export class Token{
    private readonly value: string;

    private constructor(token:string){
        this.value = token;
    }

    public static create(token:string):Result<Token>{

        if(!token  || token.trim().length === 0){
            return Result.fail('Token cannot be empty');
        } 

        if(token.length < 10){
            return Result.fail('Token must be at least 10 characters long');
        }


        return Result.ok(new Token(token));
    }

    public getValue(): string {
        return this.value;
    }
    
    public toString():string{
        return this.value;
    }
    public equals(token: Token): boolean {
        return this.value === token.value;
    }
}