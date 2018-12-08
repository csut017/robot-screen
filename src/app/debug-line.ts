import { DebugMessage } from "./websocket.service";

export class DebugLine {
    constructor(public category: string,
        public lineType: string,
        public value: string) { }

    details: any;
    isOpen: boolean;
    isSelected: boolean;

    static FromMessage(msg: DebugMessage): DebugLine {
        let name = 'error-standard',
            value = msg.type,
            category = 'unknown';
        switch (msg.type) {
            case 'FUN_CALL':
                category = 'function';
                name = 'redo';
                value = msg.details['function'];
                let args = [],
                    argList = msg.details['arguments'];
                for (let key in argList) {
                    let argVal = argList[key];
                    args.push(`${key}='${argVal}'`);
                }
                value += '(' + args.join(', ') + ')';
                break;

            case 'RES_LOOKUP':
                category = 'resource';
                name = 'deploy';
                value = `RESOURCE[${msg.details.type}]: ${msg.details.resource}`;
                break;

            case 'SCRIPT_START':
                category = 'scriptStart';
                name = 'play';
                value = `SCRIPT: ${msg.details.name}`;
                break;

            case 'BRANCH_EVAL':
                category = 'evaluation';
                if (msg.details.hit) {
                    name = 'success-standard';
                } else {
                    name = 'times-circle';
                }

                let outValues = [];
                for (var key in msg.details.branch_value) {
                    const val = msg.details.branch_value[key];
                    outValues.push(`${key}=${val}`);
                }
                let out = outValues.join(', ');
                msg.details.condition = out;

                value = `EVAL: ${out}`;
                break;
        }

        let item = new DebugLine(category, name, value);
        item.details = msg.details;
        return item;
    }
}
