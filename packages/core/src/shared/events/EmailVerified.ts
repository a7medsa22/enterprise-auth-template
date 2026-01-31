import { UserId } from "../../domain/value-objects/UserId";
import { DomainEvent } from "./DomainEvent";

export class EmailVerifiedEvent implements DomainEvent {
    public readonly occuredAt:Date;
    constructor(
        private readonly userId:UserId,

    ){
        this.occuredAt = new Date();
    }

    getAggregateId(): string {
        return this.userId.getValue();
    }

    getUser():UserId{
     return this.userId;
    };
}