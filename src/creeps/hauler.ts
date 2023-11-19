import { isArray } from "lodash";
import { BaseCreep } from "./base";
import { BigBrain } from "helpers/bigbrain";

export interface HaulerWork {
    target: AnyStructure | Resource;
    operation: "DEPOSIT" | "WITHDRAW" | undefined
}

export interface HaulerMemory extends CreepMemory {
    targetId?: Id<any>;
    depositTargetId?: Id<AnyStructure>;
    operation: "DEPOSIT" | "WITHDRAW" | undefined;
}

export class HaulerCreep extends BaseCreep {
    public memory : HaulerMemory;
    constructor(creep : Creep) {
        super(creep);
        this.memory = creep.memory as HaulerMemory;
    }

    public run() : void {
        if(this.memory.working) {
            this.work();
        }
        else {
            const foundWork = this.findWork();
            if(foundWork) this.work();
        }
    }

    public findWork() : boolean {
        const brain = new BigBrain([

            () => {
                let turret = this.findStructure((structure: AnyStructure) => {
                    return (
                        structure.structureType == STRUCTURE_TOWER &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                    );
                })
                if(!turret) return ["CONTINUE", false];
                if(isArray(turret)) {
                    if(turret.length == 0) return ["CONTINUE", false];
                    turret = turret[0];
                }
                return ["SUCCESS", {
                    target: turret,
                    operation: "DEPOSIT"
                }];

            },

            () => {
                let spawn = this.findSpawn();
                if(spawn?.store.getFreeCapacity(RESOURCE_ENERGY) == 0) return ["CONTINUE", false];
                if(!spawn) return ["CONTINUE", false];
                if(!this.hasEnoughResources()) return ["CONTINUE", false];
                return ["SUCCESS", {
                    target: spawn,
                    operation: "DEPOSIT"
                }];
            },

            () => {
                let structures = this.findStructure((structure: AnyStructure) => {
                    return (
                        structure.structureType == STRUCTURE_EXTENSION &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                    );
                })

                if(!this.hasEnoughResources()) return ["CONTINUE", false];


                if(!structures) return ["CONTINUE", false];

                if(!structures) return ["CONTINUE", false];
                if(isArray(structures)) {
                    if(structures.length == 0) return ["CONTINUE", false];
                    structures = structures[0];
                }
                return ["SUCCESS", {
                    target: structures,
                    operation: "DEPOSIT"
                }];
            },

            () => {
                const droppedResources = this.creep.room.find(FIND_DROPPED_RESOURCES,{
                    filter : (resource: Resource) =>
                    {
                        return (resource.resourceType == RESOURCE_ENERGY &&
                            resource.amount > 10)
                    }
                });
                if(droppedResources.length == 0) return ["CONTINUE", false];

                const storages = this.findStructure((structure: AnyStructure) => {
                    return (
                        (structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_CONTAINER) &&
                        structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                    );
                })
                if(isArray(storages)) {
                    if(storages.length == 0) return ["CONTINUE", false];
                }

                const closest = this.creep.pos.findClosestByRange(droppedResources);
                if(!closest) return ["CONTINUE", false];
                return ["SUCCESS", {
                    target: closest,
                    operation: "WITHDRAW"
                }];
            },


        ], () => {
            this.moveToAfkSpot();
            return this.setNotWorking("💤");
        })

        const result = brain.execute();
        if(!result) return false;
        if(!result.target) return false;

        console.log(result.target)
        this.memory.targetId = result.target.id;
        this.memory.operation = result.operation;
        this.memory.working = true;
        return true;
    }

    public work() : boolean {
        if(!this.memory.targetId) return this.setNotWorking("No target id");
        if(!this.memory.operation) return this.setNotWorking("No operation");

        let target: AnyStructure | Resource = Game.getObjectById(this.memory.targetId);

        if(!target) return this.findWork();
        switch(this.memory.operation) {
            case "DEPOSIT":
                if(target instanceof Resource) return this.setNotWorking("Invalid op");
                return this.depositWork(target);
            case "WITHDRAW":
                if(target instanceof Resource) {
                    return this.withdrawWork(target);
                }
                return false;
            default:
                return this.setNotWorking("Invalid op");
        }
    }

    public withdrawWork(target: Resource) : boolean {
        if(this.creep.store.getFreeCapacity() == 0) {
            return this.depositFoundResoure();
        }

        const result = this.creep.pickup(target);
        switch(result) {
            case ERR_NOT_IN_RANGE:
                this.creep.moveTo(target);
                return true;
            case 0:
                return true;
            default:
                return this.setNotWorking(`${result}`);
        }
    }

    public depositWork(target: AnyStructure) : boolean {
        const brain = new BigBrain([
            () => {
                if(this.creep.store.getUsedCapacity() == 0) return ["CONTINUE", false];

                const op = this.creep.transfer(target, RESOURCE_ENERGY);
                switch(op) {
                    case ERR_NOT_IN_RANGE:
                        this.creep.moveTo(target);
                        return ["SUCCESS", true];
                    case ERR_FULL:
                        return ["FAIL", false];

                    case 0:
                        return ["SUCCESS", true];
                    default:
                        return ["FAIL", false];
                }

            },

            () => {
                const op = this.getEnergyFromStorage();
                if(op) return ["SUCCESS", true];
                return ["FAIL", false];
            }

        ], () => {
            this.setNotWorking("");
            return false;
        })

        const result = brain.execute();
        if(!result) return false
        return result;
    }

    public depositFoundResoure() : boolean {
        if(!this.memory.depositTargetId) {
            let storage = this.findStructure((structure: AnyStructure) => {
                return (
                    (structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_CONTAINER) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                );
            })
            if(isArray(storage)) storage = this.findClosest(storage) as AnyStructure;
            if(!storage) return this.setNotWorking("No storage");

            this.memory.depositTargetId = storage.id;
        }

        const storage = Game.getObjectById(this.memory.depositTargetId);
        if(!storage) {
            this.memory.depositTargetId = undefined;
            return this.setNotWorking("❌📦");
        }

        const result = this.creep.transfer(storage, RESOURCE_ENERGY);
        switch(result) {
            case ERR_NOT_IN_RANGE:
                this.creep.moveTo(storage);
                return true;
            case ERR_FULL:
                this.memory.depositTargetId = undefined;
                return this.setNotWorking("Storage full");
            case OK:
                return true;
            default:
                return this.setNotWorking("Unknown error");
        }
    }

    setNotWorking(reason: string): boolean {
        this.memory.working = false;
        this.memory.targetId = undefined;
        this.memory.depositTargetId = undefined;
        this.memory.operation = undefined;
        this.creep.say(reason);
        return false;
    }

    public findClosest(buildings: AnyStructure[]) {
        return this.creep.pos.findClosestByPath(buildings);
    }

    public hasEnoughResources() : boolean {
        const structures = this.findStructure((structure: AnyStructure) => {
            return (
                (structure.structureType == STRUCTURE_STORAGE || structure.structureType == STRUCTURE_CONTAINER) &&
                structure.store.getUsedCapacity(RESOURCE_ENERGY) > 100
            );
        })
        if(isArray(structures)) {
            if(structures.length == 0) return false;
        }
        return true;

    }
}
