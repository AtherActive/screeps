import { CreepRole } from "types";

export class Spawner {
    public currentCreeps
    public spawner : StructureSpawn;

    constructor() {
        this.currentCreeps = Game.creeps;
        this.spawner = Game.spawns["Main Spawn"];

        if(this.getCreepCountByRole("harvester") < 4) {
            this.spawnCreep("harvester");
        }
        if(this.getCreepCountByRole("hauler") < 4) {
            this.spawnCreep("hauler");
        }

        // 3
        if(this.getCreepCountByRole("builder") < 2) {
            this.spawnCreep("builder");
        }

        if(this.getCreepCountByRole("upgrader") < 3) {
            this.spawnCreep("upgrader");
        }

        //3
        if(this.getCreepCountByRole("repairer") < 4) {
            this.spawnCreep("repairer");
        }
    }

    public getCreepCountByRole(role: CreepRole) : number {
        let count = 0;
        for (const name in this.currentCreeps) {
            if (this.currentCreeps[name].memory.role == role) {
                count++;
            }
        }
        return count;
    }

    public spawnCreep(role: CreepRole) : void {
        const name = role + Game.time;
        let body;

        switch(role) {
            case "harvester":
                body = [WORK, WORK, WORK, WORK, WORK, CARRY, MOVE];
                // body = [WORK,CARRY,MOVE]
                break;
            case "upgrader":
                body = [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
                break;
            case "builder":
                body = [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
                break;
            case "hauler":
                body = [CARRY, CARRY, CARRY,CARRY,CARRY,CARRY,CARRY, MOVE, MOVE, MOVE, MOVE, MOVE];
                // body = [CARRY, CARRY, MOVE];
                break;
            case "repairer":
                body = [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];
                break;
        }

        this.spawner.spawnCreep(body, name, {memory: {role: role, room: this.spawner.room.name, working: false, jobId: null}});
    }
}
