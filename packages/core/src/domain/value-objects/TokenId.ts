import { v4 as uuid } from 'uuid';

export class TokenId{
    private readonly value: string;

    private constructor(id:string){
        this.value = id;
    }

    public static create(id?:string){
        return new TokenId(id || uuid() );
    }

    public getValue(): string {
        return this.value;
    }
    
    public toString():string{
        return this.value;
    }

    public equals(tokenId: TokenId): boolean {
        return this.value === tokenId.value;
    }

}