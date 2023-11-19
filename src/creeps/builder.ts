import { BaseCreep } from "./base";
import { UpgradeCreep } from "./upgrader";

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
        if(!closestSite) {
            this.moveToAfkSpot();
            return this.setNotWorking("💤");
        }

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

    public setNotWorking(reason?: string) : boolean {
        this.memory.working = false;
        this.memory.sourceId = undefined;
        if(reason) this.creep.say(reason);
        return false;
    }

    public helpICantDoAnything() : boolean {
        this.memory.sourceId = undefined;
        this.memory.working = false;
        const newJob = new UpgradeCreep(this.creep);
        newJob.run();
        return true;
    }
}
