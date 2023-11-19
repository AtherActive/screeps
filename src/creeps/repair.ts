import { BigBrain } from "helpers/bigbrain";
import { BaseCreep } from "./base";
import { WALL_HP } from "../constants";
import jobManager from "jobs/jobManager";

export interface RepairMemory extends CreepMemory {
    sourceId?: Id<Structure>;
}


export class RepairCreep_bak extends BaseCreep {
    public memory : RepairMemory;
    constructor(creep : Creep) {
        super(creep);
        this.memory = creep.memory as RepairMemory;
    }

    public run() {
        if(this.memory.working) {
            this.work();
        }
        else {
            this.findWork();
        }
    }

    public findWork() : boolean {
        const brain = new BigBrain([
            () => {
                const closestBuilding = this.findStructure((structure: AnyStructure) => {
                    return (
                        (structure.hits < structure.hitsMax &&
                        structure.structureType != STRUCTURE_WALL &&
                        structure.structureType != STRUCTURE_RAMPART) ||
                        (structure.structureType == STRUCTURE_RAMPART && structure.hits < WALL_HP) ||
                        (structure.structureType == STRUCTURE_WALL && structure.hits < WALL_HP)
                    );
                })

                if(!closestBuilding) return ["FAIL", false];
                return ["SUCCESS", closestBuilding];
            }
        ], () => {
            this.setNotWorking("no rep");
            return false;
        })

        const structure: false | AnyStructure | AnyStructure[] = brain.execute();
        if(!structure) return false;

        if(Array.isArray(structure)) {
            const closest = this.creep.pos.findClosestByPath(structure);
            if(!closest) return this.setNotWorking("No work");
            if(!structure[0]) {
                this.moveToAfkSpot();
                return this.setNotWorking("No work")
            }
            this.memory.sourceId = closest.id
        } else {
            this.memory.sourceId = structure.id;
        }

        this.memory.working = true;
        return this.work()
    }

    public work() : boolean {
        const brain = new BigBrain([
            () => {
                if(!this.memory.sourceId) return ["FAIL", false];

                const structure = Game.getObjectById(this.memory.sourceId);
                if(!structure) return ["FAIL", false];
                if(structure.hitsMax == structure.hits) return ["FAIL", false];

                if(structure.structureType == STRUCTURE_RAMPART && structure.hits > WALL_HP) return ["FAIL", false];
                if(structure.structureType == STRUCTURE_WALL && structure.hits > WALL_HP) return ["FAIL", false];

                if(this.creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) return ["CONTINUE", "no energy"];

                const rep = this.creep.repair(structure)
                if(rep == ERR_NOT_IN_RANGE) {
                    this.creep.moveTo(structure);
                }

                return ["SUCCESS", structure];
            },

            (warning: string) => {
                if(warning != "no energy") return ["FAIL", false];
                const energy = this.getEnergyFromStorage();
                if(!energy) return ["FAIL", false];
                return ["SUCCESS", energy];
            }

        ], () => {
            this.setNotWorking();
            this.memory.sourceId = undefined;
            return false;
        })

        const result = brain.execute();
        if(!result) return false

        return true;
    }

    public setNotWorking(reason?: string): boolean {
        this.memory.working = false;
        this.memory.sourceId = undefined;
        if(reason) this.creep.say(reason);
        // this.findWork();
        return false;
    }
}


export class RepairCreep extends BaseCreep {
    constructor(creep : Creep) {
        super(creep);
    }

    public run() {
        if(this.memory.working) {
            this.work();
        }
        else {
            this.findWork();
        }
    }

    public findWork() {
        this.memory.jobId = null;

        const jobs = jobManager.getAvailableJobsForRole(this.memory.role);
        if(!jobs) return this.moveToAfkSpot();
        if(jobs.length == 0) return this.moveToAfkSpot();
        const mappedJobsForDistance = jobs.map((job) => {
            const structure = Game.getObjectById(job.targetId);
            if(!structure) return {job, distance: 9999};
            return {job, distance: this.creep.pos.getRangeTo(structure)};
        })
        mappedJobsForDistance.sort((a, b) => {
            return a.distance - b.distance;
        })
        const job = mappedJobsForDistance[0].job;
        this.memory.jobId = job.id;
        this.memory.working = true;
        job.assignedCreeps.push(this.creep.id);

        return true;
    }

    public work() : boolean {
        const brain = new BigBrain([
            () => {
                if(!this.memory.jobId) return ["FAIL", false];
                const job = jobManager.getJobById(this.memory.jobId);
                if(!job) return ["FAIL", false];


                const structure = Game.getObjectById(job.targetId);
                if(!structure) return ["FAIL", false];
                if(structure.hitsMax == structure.hits) return ["FAIL", false];

                if(structure.structureType == STRUCTURE_RAMPART && structure.hits > WALL_HP) return ["FAIL", false];
                if(structure.structureType == STRUCTURE_WALL && structure.hits > WALL_HP) return ["FAIL", false];

                if(this.creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) return ["CONTINUE", "no energy"];

                const rep = this.creep.repair(structure)
                if(rep == ERR_NOT_IN_RANGE) {
                    this.creep.moveTo(structure);
                }

                return ["SUCCESS", structure];
            },

            (warning: string) => {
                if(warning != "no energy") return ["FAIL", false];
                const energy = this.getEnergyFromStorage();
                if(!energy) return ["FAIL", false];
                return ["SUCCESS", energy];
            }

        ], () => {
            this.setNotWorking();
            return false;
        })

        const result = brain.execute();
        if(!result) return false

        return true;
    }

    public setNotWorking(reason?: string): boolean {
        this.memory.working = false;
        this.memory.jobId = null;
        if(reason) this.creep.say(reason);
        this.findWork();
        return false;
    }
}
