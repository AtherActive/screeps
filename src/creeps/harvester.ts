import { BaseCreep } from "./base";

export interface HarvesterMemory extends CreepMemory {
    sourceId?: Id<Source>;
}

export class HarvesterCreep extends BaseCreep {
    public memory : HarvesterMemory;
    constructor(creep : Creep) {
        super(creep);
        this.memory = creep.memory as HarvesterMemory;
    }

    public run() : void {
        if(this.memory.working) {
            this.work();
        }
        else {
            this.findWork();
        }
    }

    public findWork() : boolean {
        const source = this.findSource();
        if(!source) return this.setNotWorking("No source found");

        this.memory.sourceId = source.id;
        this.memory.working = true;
        return true;
    }

    public work() : boolean {
        if(!this.memory.sourceId) return this.setNotWorking("No sourceId found");

        const target = Game.getObjectById(this.memory.sourceId);
        if(!target) return this.setNotWorking("No target found");

        if(this.creep.store.getFreeCapacity("energy") == 0) {
            return this.deposit();
        }


        if(this.creep.harvest(target) == ERR_NOT_IN_RANGE) {
            this.creep.moveTo(target);
        }

        return true;
    }

    private findSource(): Source | undefined {
        const closest = this.creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);
        if(!closest) return undefined;
        if(closest.energy > 0) return closest;


        const sources = this.creep.room.find(FIND_SOURCES);
        for (const source of sources) {
            if (source.energy > 0) {
                return source;
            }
        }
        return undefined;
    }

    private deposit() : boolean {
        let target = this.creep.pos.findClosestByPath(FIND_MY_SPAWNS, {
            filter : (structure) => {
                return (structure.structureType == STRUCTURE_SPAWN && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
            }
        });
        if(!target) {
            target = this.creep.pos.findClosestByPath(FIND_MY_STRUCTURES, {
                filter : (structure) => {
                    return (structure.structureType == STRUCTURE_STORAGE && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
                }
            })
            if(!target) return this.setNotWorking("No target found")
        }

        if(this.creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            this.creep.moveTo(target);
        }
        return true;
    }

    public setNotWorking(reason?: string) : boolean {
        this.memory.working = false;
        this.memory.sourceId = undefined;
        if(reason) this.creep.say(reason);
        return false;
    }
}
