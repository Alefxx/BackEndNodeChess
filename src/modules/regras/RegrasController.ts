// Execução do movimento físico através do controlador de peças
const resultado = moveController.processarJogada('e4', 'e5', historicoCapturas);

if (resultado.sucesso) {
    // Alternância de turno após confirmação de movimento válido
    const proximoTurno = turnoAtual === 'branca' ? 'preta' : 'branca';

    // Instanciação do serviço de regras com o estado atualizado do tabuleiro
    const regrasService = new RegrasService(boardService);
    
    // Avaliação única de condições de vitória, empate ou ameaça (xeque)
    const status = regrasService.analisarStatusGeral(proximoTurno);

    if (status.fimDeJogo) {
        // Tratamento de encerramento (Persistência em banco e bloqueio de UI)
        console.log(`Fim de jogo! Motivo: ${status.motivo}`);
        if (status.vencedor) console.log(`Vitória das ${status.vencedor}`);
    } else if (status.isXeque) {
        // Evento de Xeque: Gatilho para efeitos visuais e sonoros no Front-end
        console.log(`Xeque no rei ${proximoTurno}!`);
    }
}
