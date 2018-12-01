import { DebugMessage } from "./websocket.service";

export class DebugLine {
    constructor(public lineType: string,
        public value: string) { }

    details: any;
    isOpen: boolean;

    static FromMessage(msg: DebugMessage): DebugLine {
        let name = 'error-standard',
            value = msg.type;
        switch (msg.type) {
            case 'FUN_CALL':
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
                name = 'search';
                value = `RESOURCE[${msg.details.type}]: ${msg.details.resource}`;
                break;

            case 'SCRIPT_START':
                name = 'play';
                value = `SCRIPT: ${msg.details.name}`;
                break;
        }

        let item = new DebugLine(name, value);
        item.details = msg.details;
        return item;
    }
}
