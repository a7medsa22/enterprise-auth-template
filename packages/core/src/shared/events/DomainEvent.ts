export interface DomainEvent {
    occuredAt:Date;
    getAggregateId():string;
}

export interface EventHandler<T extends DomainEvent> {
    handle(event:T):Promise<void>;
}

export interface IEventBus {
    publish(event:DomainEvent):Promise<void>;
    subscribe<T extends DomainEvent>(eventType:string,handler:EventHandler<T>):void;
}