import { ROOM_ID, WALL_HP } from "../constants";
import { BaseCreep } from "creeps/base";
import { CreepRole } from "types";

export interface JobConstructor {
    maxCreeps: number;
    jobRequiredRole: CreepRole;
    targetId: Id<any>;
    id?: string;
    assignedCreeps?: Id<Creep>[];
    postTick?: number;
    priority?: number;
    jobSpecificData?: Object;
    roomName?: string;
}

export class Job {
    public maxCreeps: number;
    public assignedCreeps: Id<Creep>[];
    public jobRequiredRole: CreepRole;
    public targetId: Id<any>;
    public postTick: number
    public priority: number;
    public jobSpecificData: Object;
    public id: string;
    public roomName: string;

    constructor({ maxCreeps, jobRequiredRole, targetId, assignedCreeps, postTick, jobSpecificData, priority, id, roomName } : JobConstructor) {
        this.maxCreeps = maxCreeps;
        this.jobRequiredRole = jobRequiredRole;
        this.targetId = targetId;

        this.assignedCreeps = assignedCreeps || [];
        this.postTick = postTick || Game.time;
        this.jobSpecificData = jobSpecificData || {};
        this.priority = priority || 1;
        this.id = id ? id : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        this.roomName = roomName || ROOM_ID;

        return this
    }

    public valdiateJob() : boolean {
        const target = Game.getObjectById(this.targetId);
        if(!target) return false;

        this.assignedCreeps.forEach(creepId => {
            const creep = Game.getObjectById(creepId);
            if(!creep) this.assignedCreeps = this.assignedCreeps.filter(id => id != creepId);
        })

        switch(this.jobRequiredRole) {
            case "harvester":
                return (target as Source).energy > 0;
            case "upgrader":
                return true;
            case "builder":
                return (target as ConstructionSite).progress != (target as ConstructionSite).progressTotal;
            case "repairer":
                if(target.structureType == STRUCTURE_WALL || target.structureType == STRUCTURE_RAMPART) {
                    return (target as StructureWall | StructureRampart).hits < WALL_HP;
                } else {
                    return (target as Structure).hits != (target as Structure).hitsMax;
                }
            case 'hauler':
                const converted = target as AnyStoreStructure;
                if(!converted.store) {
                    return true;
                }
                return (converted as AnyStoreStructure).store.getFreeCapacity(RESOURCE_ENERGY) > 0;
        }
    }

    public assignToJob(creep: BaseCreep): Job | false {
        if(this.assignedCreeps.length >= this.maxCreeps) return false;
        if(creep.memory.role != this.jobRequiredRole) return false;

        this.assignedCreeps.push(creep.creep.id)
        return this;
    }

    public unassignFromJob(creep: BaseCreep): Job | false {
        if(!this.assignedCreeps.includes(creep.creep.id)) return false;

        this.assignedCreeps = this.assignedCreeps.filter(id => id != creep.creep.id);
        return this;
    }

    public save() {
        return {
            id: this.id,
            maxCreeps: this.maxCreeps,
            jobRequiredRole: this.jobRequiredRole,
            targetId: this.targetId,
            assignedCreeps: this.assignedCreeps,
            postTick: this.postTick,
            jobSpecificData: this.jobSpecificData
        }
    }


}
