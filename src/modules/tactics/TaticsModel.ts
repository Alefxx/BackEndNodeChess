export class TacticsModel {
    fen: string;
    turno: 'w' | 'b';
    sequencia: string[]; 

    constructor(fen: string, turno: 'w' | 'b', sequencia: string[]) {
        this.fen = fen;
        this.turno = turno;
        this.sequencia = sequencia;
    }
}