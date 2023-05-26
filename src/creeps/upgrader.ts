import { BaseCreep } from "./base"

export interface UpgradeMemory extends CreepMemory {
    sourceId?: Id<StructureController>;
}

export class UpgradeCreep extends BaseCreep {
    public memory : UpgradeMemory;
    constructor(creep : Creep) {
        super(creep);
        this.memory = creep.memory as UpgradeMemory;
    }

    public run() : void {
        if(this.memory.working) {
            this.work();
        }
        else {
            this.findWork();
        }
    }

    public work(): boolean {
        if(!this.memory.sourceId) return this.setNotWorking("No sourceId found");

        const target = Game.getObjectById(this.memory.sourceId);
        if(!target) return this.setNotWorking("No target found");

        if(this.creep.store.getUsedCapacity("energy") == 0) {
            return this.withdraw();
        }

        if(this.creep.upgradeController(target) == ERR_NOT_IN_RANGE) {
            this.creep.moveTo(target);
        }

        return true
    }

    public withdraw(): boolean {
        const source = this.findEnergy();
        if(!source) return this.setNotWorking("No source found");

        if(this.creep.withdraw(source, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            this.creep.moveTo(source);
        }
        return true
    }

    public findEnergy() : Structure | false{
        // const source = this.creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
        //     filter: (structure) => {
        //         return structure.structureType == STRUCTURE_STORAGE && structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0
        //     }
        // })
        const source = this.creep.pos.findClosestByPath(FIND_MY_SPAWNS, {
            filter: (structure) => {
                return structure.store.getUsedCapacity(RESOURCE_ENERGY) > 250 && structure.spawning == null;
            }
        })
        if(!source) return this.setNotWorking("No source found");
        return source;
    }

    public findWork(): boolean {
        const controller = this.creep.room.controller;
        if(!controller) return this.setNotWorking("No controller found");
        this.memory.sourceId = controller.id;
        this.memory.working = true;
        return true
    }

    public setNotWorking(reason: string): false {
        this.memory.working = false;
        this.memory.sourceId = undefined;
        if(reason) this.creep.say(reason);
        return false;
    }
}
