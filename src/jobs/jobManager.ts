import { Job, JobConstructor } from "./job";
import {ROOM_ID, WALL_HP, maxPerJobType} from "../constants"
import { max } from "lodash";
import { CreepRole } from "types";

export interface JobManagerMemory {
    jobs: JobConstructor[];
}

export class JobManager {
    public memory: JobManagerMemory;
    public room: Room
    public jobs: Job[];

    constructor(roomId: string) {
        if(!Memory.jobManager) Memory.jobManager = { jobs: [] };
        this.memory = Memory.jobManager || { jobs: [] };
        this.room = Game.rooms[roomId];
        this.jobs = this.loadJobs();

        this.findJobs();
    }

    public loop() {
        global.getJobById = (id: string) => this.getJobById(id);
        this.memory = Memory.jobManager || { jobs: [] };
        this.jobs = this.loadJobs();

        this.validateAll();
        this.findJobs();

        const jobCounts = this.jobsPerRoleCount();
        console.log(`[JOBS] MINE: ${jobCounts.harvester} | UPGR: ${jobCounts.upgrader} | BULD: ${jobCounts.builder} | HAUL: ${jobCounts.hauler} | REPR: ${jobCounts.repairer}`)
    }

    public loadJobs() {
        return this.memory.jobs.map(job => new Job(job));
    }

    public validateAll() {
        let removed  = 0
        this.jobs.forEach(job => {
            const result = job.valdiateJob()
            if(!result) {
                removed++;
                this.removeJob(job);
            }
        });
        console.log(`[JOBS] Removed ${removed} jobs, ${this.jobs.length} remaining.`)
    }

    public removeJob(job: Job) {
        this.jobs = this.jobs.filter(j => j != job);
    }

    public findJobs() : void {
        this.findHarvesterJobs();
        this.findUpgraderJobs();
        this.findBuilderJobs();
        this.findRepairerJobs();
        this.findHaulerJobs();
    }

    public findHarvesterJobs() {
        const sources = this.room.find(FIND_SOURCES)
        if(sources.length == 0 ) return;

        for(const source of sources) {
            const doesExist = this.jobs.find(job => job.targetId == source.id);
            if(source.energy == 0) continue;
            if(doesExist) continue;

            const jobObject = new Job({
                maxCreeps: maxPerJobType.harvesting,
                jobRequiredRole: "harvester",
                targetId: source.id,
                priority: 1,
                roomName: this.room.name
            })

            this.jobs.push(jobObject);
        }
    }

    public findUpgraderJobs() {
        const controller = this.room.controller;
        if(!controller) return;

        const doesExist = this.jobs.find(job => job.targetId == controller.id);
        if(doesExist) return;

        const jobObject = new Job({
            maxCreeps: maxPerJobType.upgrading,
            jobRequiredRole: "upgrader",
            targetId: controller.id,
            priority: 1,
            roomName: this.room.name
        })

        this.jobs.push(jobObject);
    }

    public findBuilderJobs() {
        const sites = this.room.find(FIND_CONSTRUCTION_SITES);
        if(sites.length == 0) return;

        for(const site of sites) {
            const doesExist = this.jobs.find(job => job.targetId == site.id);
            if(doesExist) continue;

            const jobObject = new Job({
                maxCreeps: maxPerJobType.building,
                jobRequiredRole: "builder",
                targetId: site.id,
                priority: 1,
                roomName: this.room.name
            })

            this.jobs.push(jobObject);
        }
    }

    public findRepairerJobs() {
        const buildings = this.room.find(FIND_STRUCTURES, {
            filter: structure => (structure.structureType != STRUCTURE_WALL &&
            structure.structureType != STRUCTURE_RAMPART &&
                structure.hits < structure.hitsMax) ||
            (structure.structureType == STRUCTURE_WALL && structure.hits < WALL_HP) ||
            (structure.structureType == STRUCTURE_RAMPART && structure.hits < WALL_HP)
        })
        if(buildings.length == 0) return;

        for(const building of buildings) {
            const doesExist = this.jobs.find(job => job.targetId == building.id);
            if(doesExist) continue;

            const priority = ((building.structureType == STRUCTURE_WALL || building.structureType == STRUCTURE_RAMPART) && building.hits < WALL_HP/4)? 100 :
            (building.structureType == STRUCTURE_WALL || building.structureType == STRUCTURE_RAMPART)? 10 : 1;

            const jobObject = new Job({
                maxCreeps: maxPerJobType.repairer,
                jobRequiredRole: "repairer",
                priority: priority,
                roomName: this.room.name,
                targetId: building.id
            })

            this.jobs.push(jobObject);
        }
    }

    public findHaulerJobs() {
        const droppedResources = this.room.find(FIND_DROPPED_RESOURCES);
        if(droppedResources.length == 0) return;

        for(const resource of droppedResources) {
            const doesExist = this.jobs.find(job => job.targetId == resource.id);
            if(doesExist) continue;

            const jobObject = new Job({
                maxCreeps: resource.amount < 500 ? 1 : maxPerJobType.hauling,
                jobRequiredRole: "hauler",
                targetId: resource.id,
                priority: 1,
                roomName: this.room.name,
                jobSpecificData: {
                    type: "WITHDRAW"
                }
            })

            this.jobs.push(jobObject);
        }

        const structuresNeedEnergy = this.room.find(FIND_STRUCTURES, {
            filter: structure => structure.structureType == (STRUCTURE_EXTENSION ||
            structure.structureType == STRUCTURE_SPAWN ||
            structure.structureType == STRUCTURE_TOWER) &&
            structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
        })

        if(structuresNeedEnergy.length == 0) return;

        for(const structure of structuresNeedEnergy as AnyStoreStructure[]) {
            const doesExist = this.jobs.find(job => job.targetId == structure.id);
            if(doesExist) continue;

            const priorty = structure.structureType == STRUCTURE_SPAWN ? 10 :
                structure.structureType == STRUCTURE_EXTENSION ? 10 :
                structure.structureType == STRUCTURE_TOWER ? 100 : 1;
            const jobObject = new Job({
                maxCreeps: structure?.store?.getFreeCapacity(RESOURCE_ENERGY) > 300 ? maxPerJobType.hauling / 2 : maxPerJobType.hauling,
                jobRequiredRole: "hauler",
                targetId: structure.id,
                priority: priorty,
                roomName: this.room.name,
                jobSpecificData: {
                    type: "DEPOSIT"
                }
            })

            this.jobs.push(jobObject);
        }

    }

    public getAvailableJobsForRole(role: CreepRole) {
        const jobs = this.jobs.filter(job => job.jobRequiredRole == role && job.assignedCreeps.length < job.maxCreeps);
        return jobs.sort((a, b) => a.priority - b.priority)
    }

    public getJobById(id: string) {
        return this.jobs.find(job => job.id == id);
    }

    public jobsPerRoleCount() {
        let count = {
            "harvester": 0,
            "upgrader": 0,
            "builder": 0,
            "repairer": 0,
            "hauler": 0,
        }

        this.jobs.forEach(job => {
            count[job.jobRequiredRole] += 1;
        })

        return count;
    }

    public save() {
        Memory.jobManager.jobs = this.jobs.map(job => job.save());
    }

}


export default new JobManager(ROOM_ID);
