import { WALL_HP } from "./constants";
import { BaseCreep } from "creeps/base";

export function turret(creep: StructureTower) {
    if(!attack(creep)) {
        repair(creep);
    }
}

function attack(creep: StructureTower) {
    const enemies = creep.room.find(FIND_HOSTILE_CREEPS);
    if(enemies.length == 0) return false

    const closest = creep.pos.findClosestByRange(enemies);
    if(!closest) return false

    creep.attack(closest);
    return true;
}

function repair(creep: StructureTower) {
    const structures = creep.room.find(FIND_STRUCTURES, {
        filter: (structure) => {
            return (
                structure.structureType == STRUCTURE_WALL ||
                structure.structureType == STRUCTURE_RAMPART
            ) && structure.hits < WALL_HP
        }
    })

    if(structures.length == 0) return false;

    const closest = creep.pos.findClosestByRange(structures, {
        filter: (structure: AnyStructure) => {
            // max range of 5
            return creep.pos.inRangeTo(structure, 10);
        }
    });
    if(!closest) return false;

    creep.repair(closest);
    return true;
}
