type BigbrainFunction = (...args: any[]) => [BigBrainReturns, any];
type BigBrainReturns = "FAIL" | "BREAK" | "CONTINUE" | "SUCCESS";

export class BigBrain {
    public functions: Array<BigbrainFunction>;
    public failed: Function;

    constructor(functions: Array<BigbrainFunction>, failed: Function) {
        this.functions = functions;
        this.failed = failed;
    }

    public execute() : any {

        let args = ["test"]
        for (const func of this.functions) {
            const result = func(...args);
            if(result[0] === "FAIL") break;
            if(result[0] === "BREAK") return;
            if(result[0] === "SUCCESS") return result[1];

            //@ts-ignore
            args[0] = result[1]
        }

        return this.failed();
    }
}
