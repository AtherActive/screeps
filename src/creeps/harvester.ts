import jobManager from "jobs/jobManager";
import { BaseCreep } from "./base";


export class HarvesterCreep extends BaseCreep {
    constructor(creep : Creep) {
        super(creep);
    }

    public run() : void {
        if(this.memory.working) {
            this.work();
        }
        else {
            this.findWork();
        }
    }

    // public findWork() : boolean {
    //     const source = this.findSource();
    //     if(!source) return this.setNotWorking("No source found");

    //     this.memory.sourceId = source.id;
    //     this.memory.working = true;
    //     return true;
    // }

    public work() : boolean {
        if(!this.memory.jobId) return this.setNotWorking("No job found")
        const job = jobManager.getJobById(this.memory.jobId);
        if(!job) return this.setNotWorking("Job not found");

        const target = Game.getObjectById(job.targetId) as Source;

        if(this.creep.store.getFreeCapacity("energy") == 0) {
            return this.deposit();
        }


        if(this.creep.harvest(target) == ERR_NOT_IN_RANGE) {
            this.creep.moveTo(target, {reusePath: 10});
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
        this.creep.drop("energy", this.creep.store.getUsedCapacity("energy"));
        return true
    }

    public setNotWorking(reason?: string) : boolean {
        this.memory.working = false;
        this.memory.jobId = null;
        if(reason) this.creep.say(reason);
        return this.findWork();
    }
}
