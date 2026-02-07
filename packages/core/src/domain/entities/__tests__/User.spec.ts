import { Email } from '../../value-objects/Email';
import { Password } from '../../value-objects/Password';
import { Role, User } from '../User';

describe('User Entity', () => {
  const validEmail = () => Email.create('test123@test.com').getValue();
  const validPassword = () => Password.create({ value: 'hashed-pass', hashed: true }).getValue();

  const createUser = () =>
  User.create({
    email: validEmail(),
    password: validPassword(),
    role: [Role.USER],
  })
  
  describe('create', () => {
    it('should create a user successfully with valid data', () => {
      const result = createUser()
      expect(result.isSuccess).toBe(true);

      const user = result.getValue();
      expect(user.isActive()).toBe(true);
      expect(user.isEmailVerified()).toBe(false);
      expect(user.getRoles()).toContain(Role.USER);
    });

    it('should fail if user has no roles', () => {
      const result = User.create({
        email: validEmail(),
        password: validPassword(),
        role: [],
      });

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('User must have at least one role');
    });
  });
  describe('verifyEmail', () => {
    it('should verify email once', () => {
      const user = createUser().getValue();
      const result = user.verifyEmail();
      expect(result.isSuccess).toBe(true);
      expect(user.isEmailVerified()).toBe(true);
    });
    it('should fail if email is already verified', () => {
      const user = createUser().getValue();
      user.verifyEmail();
      const result = user.verifyEmail();
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Email already verified');
    });
  });
  describe('changePassword', () => {
    it('should change password successfully', () => {
      const user = createUser().getValue();
      const newPassword = Password.create({
        value: 'new-password-hash',
        hashed: true,
      }).getValue();
      const result = user.changePassword(newPassword);

      expect(result.isSuccess).toBe(true);
      expect(user.getPassword().equals(newPassword)).toBe(true);
    });
    it('should fail if new password is same as current', () => {
      const user = createUser().getValue();
      const password = validPassword()
      const result = user.changePassword(password);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('New password must be different from old password');
    });
  });
  describe('role management', () => {
    it('should add role successfully', () => {
      const user = createUser().getValue();
      const result = user.addRole(Role.ADMIN);
      expect(result.isSuccess).toBe(true);
      expect(user.hasRole(Role.ADMIN)).toBe(true);
    });
    it('should fail to remove last role', () => {
      const user = createUser().getValue();

      const result = user.removeRole(Role.USER);

      expect(result.isFailure).toBe(true);
      expect(result.error).toBe('Cannot remove last role');
    });
  });
});
