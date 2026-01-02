export interface TokenStorage {
    save(userId: string, tokenId: string, expiresIn: number): Promise<void>;

    exists(userId:string,tokenId:string): Promise<boolean>;

    revoke(userId:string,tokenId:string): Promise<void>;
}