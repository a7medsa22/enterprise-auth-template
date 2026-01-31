import { Email } from "../../domain/value-objects/Email";
import { IPAddress } from "../../domain/value-objects/IpAddress";
import { UserId } from "../../domain/value-objects/UserId";
import { DomainEvent } from "./DomainEvent";

export class UserLoginEvent implements DomainEvent {
    public readonly occuredAt:Date;
    constructor(
        private readonly userId:UserId,
        private readonly ipAddress :IPAddress
    ){
        this.occuredAt = new Date()
    }

    getAggregateId():string{
        return this.userId.getValue();
    }

    getUserId():UserId{
        return this.userId;
    }

    getIpAddress():IPAddress{
        return this.ipAddress;
    }
}