export class AbstractSyntaxTree {
    constructor(public name: string,
        nodes: any) {
        this.nodes = nodes;
    }

    nodes: ASTNode[];
}

export interface ASTNode {
    args: ASTNode[];
    children: ASTNode[];
    id: string;
    token: ASTToken;
    type: string;
}

export interface ASTToken {
    type: string;
    value: string;
    start_pos: number;
}