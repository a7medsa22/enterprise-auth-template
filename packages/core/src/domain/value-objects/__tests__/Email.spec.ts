import { Email } from "../Email"

describe('Email Value Object', () => {
    describe('create', () => {
        it('should create valid email', () => {
            const result = Email.create('test@example.com');

            expect(result.isSuccess).toBe(true);
            expect(result.getValue().getValue()).toBe('test@example.com');
        });
        it('should convert to lowercase', () => {
            const result = Email.create('TEST@EXAMPLE.COM');

            expect(result.isSuccess).toBe(true);
            expect(result.getValue().getValue()).toBe('test@example.com')
        });
        it('should fail for empty email', () => {
            const result = Email.create('');

            expect(result.isFailure).toBe(true);
            expect(result.error).toBe('Email cannot be empty');
        });
        it('should fail for invlid format', () => {
            const result = Email.create('test-example');

            expect(result.isFailure).toBe(true);
            expect(result.error).toBe('Invalid email format')
        });
    });
    describe('equals', () => {
        it('should return true for same email and vice versa', () => {
            const result1 = Email.create('test@example.com').getValue();
            const result2 = Email.create('test@example.com').getValue();
            const result3 = Email.create('deffrantemail@example.com').getValue();

            expect(result1.equals(result2)).toBe(true);
            expect(result1.equals(result3)).toBe(false);
        })
    })

})