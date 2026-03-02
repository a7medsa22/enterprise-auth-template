import { Password } from '../Password';

describe('Password Value Object', () => {
    describe('create with raw password', () => {
        it('should create valid password with Upercase and Lowercase char', () => {
            const result = Password.create({
                value: 'Test@1234',
                hashed: false,
            });

            expect(result.isSuccess).toBe(true);
            expect(result.getValue().getValue()).toContain('t')
            expect(result.getValue().getValue()).toContain('T')
            expect(result.getValue().getValue()).toContain('1')
        });

        it('should fail if less than 8 characters', () => {
            const result = Password.create({
                value: 'Test@12',
                hashed: false,
            });

            expect(result.isFailure).toBe(true);
            expect(result.error).toBe('Password must be at least 8 characters');
        });
        
        it('should fail if no special character', () => {
            const result = Password.create({
                value: 'Test1234',
                hashed: false,
            });

            expect(result.isFailure).toBe(true);
            expect(result.error).toContain('special character');
        });
    });

    describe('create with hashed password', () => {
        it('should create without validation', () => {
            const result = Password.create({
                value: 'hashed-password-string',
                hashed: true,
            });

            expect(result.isSuccess).toBe(true);
            expect(result.getValue().isHashed()).toBe(true);
        });
    });
});
