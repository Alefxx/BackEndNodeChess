export class RegrasController {
    private moveController: any;
    private regrasService: any;

    constructor(moveController: any, regrasService: any) {
        this.moveController = moveController;
        this.regrasService = regrasService;
    }

    public avaliarTurnoEStatus(
        origem: string, 
        destino: string, 
        turnoAtual: 'branca' | 'preta', 
        historicoCapturas: string[]
    ): void {
        const resultado = this.moveController.processarJogada(origem, destino, historicoCapturas);

        if (resultado.sucesso) {
            const proximoTurno = turnoAtual === 'branca' ? 'preta' : 'branca';
            const status = this.regrasService.analisarStatusGeral(proximoTurno);

            if (status.fimDeJogo) {
                console.log(`Fim de jogo! Motivo: ${status.motivo}`);
                
                if (status.vencedor) {
                    console.log(`Vitória das ${status.vencedor}`);
                }
            } else if (status.isXeque) {
                console.log(`Xeque no rei ${proximoTurno}!`);
            }
        }
    }
}

