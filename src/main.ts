import { BaseCreep } from "creeps/base";
import { BuilderCreep } from "creeps/builder";
import { HarvesterCreep } from "creeps/harvester";
import { HaulerCreep } from "creeps/hauler";
import { RepairCreep } from "creeps/repair";
import { UpgradeCreep } from "creeps/upgrader";
import { Job } from "jobs/job";
import jobManager, { JobManager, JobManagerMemory } from "jobs/jobManager";
import { Spawner } from "spawner/spawner";
import { CreepRole } from "types";
import { ErrorMapper } from "utils/ErrorMapper";
import { turret as Turret } from "tempturret";
import { ROOM_ID } from "./constants";

declare global {
  /*
    Example types, expand on these or remove them and add your own.
    Note: Values, properties defined here do no fully *exist* by this type definiton alone.
          You must also give them an implemention if you would like to use them. (ex. actually setting a `role` property in a Creeps memory)

    Types added in this `global` block are in an ambient, global context. This is needed because `main.ts` is a module file (uses import or export).
    Interfaces matching on name from @types/screeps will be merged. This is how you can extend the 'built-in' interfaces from @types/screeps.
  */
  // Memory extension samples
  interface Memory {
    uuid: number;
    log: any;
    jobManager: JobManagerMemory;
  }

  interface CreepMemory {
    role: CreepRole;
    room: string;
    working: boolean;
    jobId: string | null;
  }

  // Syntax for adding proprties to `global` (ex "global.log")
  namespace NodeJS {
    interface Global {
      log: any;
      getJobById: (id: string) => Job | undefined;
    }
  }
}
//@ts-ignore
global.jobManager = jobManager;
// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
    console.log(`Current game tick is ${Game.time}`);
    jobManager.loop();
    const spawner = new Spawner();

    // Automatically delete memory of missing creeps
    for (const name in Memory.creeps) {
        if (!(name in Game.creeps)) {
          delete Memory.creeps[name];
          console.log("[RIP] ", name)
          return
        }

        const creep = Game.creeps[name];
        const role = creep.memory.role;

        let instance: BaseCreep | null
        switch(role) {
          case "harvester":
            instance = new HarvesterCreep(creep);
            break;
          case "upgrader":
            instance = new UpgradeCreep(creep);
            break;
          case "builder":
            instance = new BuilderCreep(creep);
            break;
          case "repairer":
            instance = new RepairCreep(creep);
            break;
          case "hauler":
            instance = new HaulerCreep(creep);
            break;
          default:
            instance = null;
        }
        if(instance !== null) instance.run();

      }

      const turret = Game.rooms[ROOM_ID].find(FIND_STRUCTURES, {
        filter: (structure) => {
          return structure.structureType == STRUCTURE_TOWER;
        }
      })
      if(turret) {
        for(const t of turret) {
          Turret(t as StructureTower);
        }
      }

    jobManager.save();
    console.log(`End of tick, CPU: ${Math.round(Game.cpu.getUsed()/(Game.cpu.limit)*100)}%`)
    console.log(``)
});
