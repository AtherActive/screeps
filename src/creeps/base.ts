import { CreepBodyPart } from "types";

export abstract class BaseCreep {
    creep : Creep;
    memory : CreepMemory;

    constructor(creep : Creep) {
        this.creep = creep;
        this.memory = creep.memory;
    }

    run() : void {
        console.log("BaseCreep.run");
    }

    abstract work() : boolean;
    abstract findWork() : boolean;
    abstract setNotWorking(reason : string) : boolean;


}

