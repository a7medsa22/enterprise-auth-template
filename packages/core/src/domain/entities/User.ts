import { Entity } from "./base/Entity";
import { Result } from "../../shared/utils/Result";
import { Email } from "../value-objects/Email";
import { Password } from "../value-objects/Password";
import { UserId } from "../value-objects/UserId";

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
}

interface UserProps {
  id: UserId;
  email: Email;
  password: Password;
  roles: Role[];
  isActive: boolean;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserProps {
  email: Email
  password: Password
  role: Role[]
}

export class User extends Entity<UserId> {
  private email: Email;
  private password: Password;
  private roles: Role[];
  private _isActive: boolean;
  private _emailVerified: boolean;
  private _lastLoginAt?: Date;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: UserProps) {
    super(props.id);
    this.email = props.email;
    this.password = props.password;
    this.roles = props.roles;
    this._isActive = props.isActive;
    this._emailVerified = props.emailVerified;
    this._lastLoginAt = props.lastLoginAt;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }
  // Factory method to create a new user
  public static create(props: CreateUserProps): Result<User> {
    if (props.role.length === 0) {
      return Result.fail('User must have at least one role');
    }

    const id = UserId.create();
    const user = new User({
      id: UserId.create(id.getValue()),
      email: props.email,
      password: props.password,
      roles: props.role,
      isActive: true,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return Result.ok(user);
  }
  // Factory method to restore a user from database
  //@internal
  public static restore(props: UserProps): User {
    return new User(props);
  }

  public verifyEmail():Result<void>{
    if(this._emailVerified)
      return Result.fail('Email already verified');
    this._emailVerified = true;
    this._updatedAt = new Date();
    return Result.ok();
  }

  public changePassword(newPassword: Password): Result<void> {
    if(this.password.equals(newPassword))
      return Result.fail('New password must be different from old password');

    this.password = newPassword;
    this._updatedAt = new Date();
    return Result.ok();
  }

  public updateLastLogin(): Result<void> {
    this._lastLoginAt = new Date();
    this._updatedAt = new Date();
    return Result.ok();
  }

  public activate(): Result<void> {
    if(this._isActive)
      return Result.fail('User is already active');
    this._isActive = true;
    this._updatedAt = new Date();
    return Result.ok();
  }

  public deactivate(): Result<void> {
    if(!this._isActive)
      return Result.fail('User is already inactive');
    this._isActive = false;
    this._updatedAt = new Date();
    return Result.ok();
  }

   public hasRole(role: Role): boolean {
    return this.roles.includes(role);
  }

  public addRole(role: Role): Result<void> {
    if (this.hasRole(role)) {
      return Result.fail(`User already has role: ${role}`);
    }
    this.roles.push(role);
    this._updatedAt = new Date();
    return Result.ok();
  }

  public removeRole(role: Role): Result<void> {
    if (!this.hasRole(role)) {
      return Result.fail(`User does not have role: ${role}`);
    }
    if (this.roles.length === 1) {
      return Result.fail('Cannot remove last role');
    }
    this.roles = this.roles.filter(r => r !== role);
    this._updatedAt = new Date();
    return Result.ok();
  }

  //Getters
  public getEmail(): Email {
    return this.email;
  }

   public getPassword(): Password {
    return this.password;
  }

  public getRoles(): Role[] {
    return [...this.roles];
  }

  public isActive(): boolean {
    return this._isActive;
  }

  public isEmailVerified(): boolean {
    return this._emailVerified;
  }

  public getLastLoginAt(): Date | undefined {
    return this._lastLoginAt;
  }

  public getCreatedAt(): Date {
    return this._createdAt;
  }

  public getUpdatedAt(): Date {
    return this._updatedAt;
  }



}

