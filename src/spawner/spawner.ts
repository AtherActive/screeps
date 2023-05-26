import { CreepRole } from "types";

export class Spawner {
    public currentCreeps
    public spawner : StructureSpawn;

    constructor() {
        this.currentCreeps = Game.creeps;
        this.spawner = Game.spawns["Main Spawn"];

        if(this.getCreepCountByRole("harvester") < 5) {
            this.spawnCreep("harvester");
        }

        if(this.getCreepCountByRole("builder") < 2) {
            this.spawnCreep("builder");
        }

        if(this.getCreepCountByRole("upgrader") < 2) {
            this.spawnCreep("upgrader");
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
                body = [WORK, CARRY, MOVE];
                break;
            case "upgrader":
                body = [WORK, CARRY, MOVE];
                break;
            case "builder":
                body = [WORK, CARRY, MOVE];
                break;
            case "hauler":
                body = [CARRY, CARRY, MOVE];
        }

        this.spawner.spawnCreep(body, name, {memory: {role: role, room: this.spawner.room.name, working: false}});
    }
}
