import { DomainEvent } from "./DomainEvent";
import { UserId } from "../../domain/value-objects/UserId";
import { Email } from "../../domain/value-objects/Email";

export class UserRegisteredEvent implements DomainEvent{
    public readonly occuredAt:Date;
    constructor(
        private readonly userId:UserId,
        private readonly email:Email
    ){
        this.occuredAt = new Date()
    }

        getAggregateId():string{
        return this.userId.getValue();
    }

    getUserId():string{
        return this.userId.getValue();
    }

    getEmail():string{
        return this.email.getValue();
    }
}