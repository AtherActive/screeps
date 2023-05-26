import { BaseCreep } from "./base";

export interface BuilderMemory extends CreepMemory {
    sourceId?: Id<ConstructionSite>;
}

export class BuilderCreep extends BaseCreep {
    public memory : BuilderMemory;
    constructor(creep : Creep) {
        super(creep);
        this.memory = creep.memory as BuilderMemory;
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
        const closestSite = this.creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
        if(!closestSite) return this.setNotWorking("No site found");

        this.memory.working = true;
        this.memory.sourceId = closestSite.id;
        return true;
    }

    public work() : boolean {
        if(!this.memory.sourceId) {
            return this.setNotWorking("No sourceId found");
        }

        const site = Game.getObjectById(this.memory.sourceId);
        if(!site) return this.setNotWorking("No site found");

        if(this.creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) return this.getEnergyFromStorage();

        if(this.creep.build(site) == ERR_NOT_IN_RANGE) {
            this.creep.moveTo(site);
        }

        return true;
    }

    private getEnergyFromStorage() : boolean {
        const storage = this.creep.pos.findClosestByPath(FIND_MY_SPAWNS, {
            filter: (structure) => {
                return structure.store.getUsedCapacity(RESOURCE_ENERGY) > 250 && structure.spawning == null;
            }
        })
        if(!storage) return this.setNotWorking("no storage found");

        const carryAmount = this.creep.store.getUsedCapacity(RESOURCE_ENERGY);
        if(this.creep.withdraw(storage, RESOURCE_ENERGY, carryAmount) == ERR_NOT_IN_RANGE) {
            this.creep.moveTo(storage);
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
