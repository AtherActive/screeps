import { BigBrain } from "../helpers/bigbrain";
import jobManager from "jobs/jobManager";

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
    abstract setNotWorking(reason : string) : boolean;

    public findWork() : boolean {
        this.memory.jobId = null;

        const jobs = jobManager.getAvailableJobsForRole(this.memory.role);
        if(!jobs) return this.moveToAfkSpot();
        if(jobs.length == 0) return this.moveToAfkSpot();
        const job = jobs[0];
        this.memory.jobId = job.id;
        this.memory.working = true;
        job.assignedCreeps.push(this.creep.id);

        return true;
    }

    public getEnergyFromStorage() : boolean{
        // const sources = this.creep.pos.findClosestByPath(FIND_STRUCTURES, {
        //     filter : (structure) => {
        //         return (structure.structureType == "container" && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
        //     }
        // })

        // if(!sources) return false;

        // if(this.creep.withdraw(sources, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
        //     this.creep.moveTo(sources);
        // }
        // return true;

        const brain = new BigBrain([
            () => {
                const foundStructure = this.findStructure((structure: AnyStructure) => {
                    return (
                        (
                            structure.structureType == STRUCTURE_CONTAINER ||
                            structure.structureType == STRUCTURE_STORAGE
                        ) &&
                        structure.store.getUsedCapacity(RESOURCE_ENERGY) > 0
                    );
                })
                if(!foundStructure) return ["CONTINUE", false]
                return ["SUCCESS", foundStructure];
            },
            () => {
                const foundSpawn = this.findSpawn();
                if(!foundSpawn) return ["CONTINUE", false];
                return ["SUCCESS", foundSpawn];
            }
        ], () => {
            this.setNotWorking("No Energy");
            return false;
        })

        let structure = brain.execute();
        if(!structure) return false;
        if(structure?.length ) structure = structure[0];


        const action = this.creep.withdraw(structure, RESOURCE_ENERGY)
        if(action == ERR_NOT_IN_RANGE) {
            this.creep.moveTo(structure);
        }
        return true;
    }

    public findStructure(filter: FilterObject, closests = false) : false | AnyStructure | AnyStructure[] {
        let structures;

        if(closests) {
            structures = this.creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter : filter
            })
        } else {
            structures = this.creep.room.find(FIND_STRUCTURES, {
                filter : filter
            })

        }

        if(!structures) return false;
        return structures;
    }

    public findSpawn() : StructureSpawn | null {
        const spawn = this.creep.pos.findClosestByPath(FIND_MY_SPAWNS, {
            filter : (spawn: StructureSpawn) => {
                return spawn.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        })
        if(!spawn) return null;
        return spawn;
    }

    public moveToAfkSpot() {
        const afkSpot = new RoomPosition(32, 8, this.creep.room.name);
        this.creep.moveTo(afkSpot);
        return false;
    }

}

