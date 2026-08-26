import { Posicao, Cor, Peca } from '../virtualboard/VirtualBoard'; 
import { VirtualBoardService } from '../virtualboard/VirtualBoardService';
import { MoveController } from '../move/MoveController';

/**
 * Interface de retorno para operações de movimento.
 * Encapsula o estado final da jogada e sinalizadores de eventos especiais (Xeque, Promoção, Empate).
 */
export interface RetornoMovimento {
    sucesso: boolean;
    isXeque?: boolean;
    corAdversaria?: Cor;
    isEmpateRepeticao?: boolean;
    requerPromocao?: boolean; // Sinaliza ao Front-end a necessidade de abrir o modal de escolha
}

/**
 * Orquestrador de Movimentação (MoveService).
 * Gerencia o ciclo de vida de um lance: validação, captura, regras especiais e detecção de status.
 */
export class MoveService {
    private boardService: VirtualBoardService;
    private moveController: MoveController;

    constructor(boardService: VirtualBoardService) {
        this.boardService = boardService;
        this.moveController = new MoveController(boardService);
    }

    /**
     * Validação primária: verifica se a peça pertence ao jogador do turno 
     * e se o destino consta na lista de movimentos legais da peça.
     */
    public checarMove(origem: Posicao, destino: Posicao, corDoTurno: Cor): boolean {
        const peca = this.boardService.tabuleiro.getPecaNaCasa(origem);

        if (!peca || peca.cor !== corDoTurno) {
            return false;
        }

        const casasPossiveis = this.moveController.solicitarCasasPossiveis(origem, corDoTurno);
        return casasPossiveis.includes(destino);
    }

    /**
     * Gerencia a remoção de peças do tabuleiro. 
     * Inclui suporte à captura "En Passant" (quando a peça alvo não reside na casa de destino).
     */
    private comerPeca(origem: Posicao, destino: Posicao, pecaMovimentada: Peca, historicoCapturas: string[]): boolean {
        let pecaAlvo = this.boardService.tabuleiro.getPecaNaCasa(destino);
        let casaDaCaptura = destino;

        // Lógica específica para En Passant: detecção de captura em coluna diferente sem peça no destino direto
        if (!pecaAlvo && pecaMovimentada.tipo === 'peao' && origem.charAt(0) !== destino.charAt(0)) {
            const linhaDeOndeVeio = origem.charAt(1);
            casaDaCaptura = `${destino.charAt(0)}${linhaDeOndeVeio}` as Posicao;
            pecaAlvo = this.boardService.tabuleiro.getPecaNaCasa(casaDaCaptura);
        }
        
        if (pecaAlvo) {
            historicoCapturas.push(pecaAlvo.tipo);
            this.boardService.tabuleiro.removerPeca(casaDaCaptura);
            return true; 
        }
        
        return false; 
    }

    /**
     * Atualiza os metadados do tabuleiro (Roque, En Passant e contador de repetição).
     * @returns boolean Indicando se a contagem para empate por repetição deve ser reiniciada.
     */
    private aplicarConsequenciasFisicas(peca: Peca, origem: Posicao, destino: Posicao, isCaptura: boolean): boolean {
        let zeraContagemRepeticao = false;
        const isPeao = peca.tipo === 'peao';

        // Regra dos 50 lances/repetição: lances de peão ou capturas reiniciam o histórico
        if (isPeao || isCaptura) zeraContagemRepeticao = true;
        
        // Limpa o alvo de En Passant do turno anterior
        this.boardService.tabuleiro.alvoEnPassant = null;

        // Define novo alvo de En Passant se for um avanço duplo de peão
        if (isPeao) {
            const linhaOrigem = parseInt(origem.charAt(1), 10);
            const linhaDestino = parseInt(destino.charAt(1), 10);
            if (Math.abs(linhaDestino - linhaOrigem) === 2) {
                const direcao = peca.cor === 'branca' ? 1 : -1;
                this.boardService.tabuleiro.alvoEnPassant = `${origem.charAt(0)}${linhaOrigem + direcao}`;
            }
        }

        // Gestão de Direitos de Roque
        if (peca.tipo === 'rei') {
            this.boardService.tabuleiro.direitosRoque[peca.cor].roquePequeno = false;
            this.boardService.tabuleiro.direitosRoque[peca.cor].roqueGrande = false;
            
            const colOrigem = origem.charCodeAt(0);
            const colDestino = destino.charCodeAt(0);
            
            // Se for um movimento de Roque (deslocamento lateral de 2 casas), move a torre associada
            if (Math.abs(colDestino - colOrigem) === 2) {
                const linha = origem.charAt(1); 
                const destArquivo = destino.charAt(0);
                
                if (destArquivo === 'g') this.boardService.forcarMovimento(`h${linha}` as Posicao, `f${linha}` as Posicao); 
                else if (destArquivo === 'c') this.boardService.forcarMovimento(`a${linha}` as Posicao, `d${linha}` as Posicao); 
            }
        } 

        // Perda de direito de roque se uma torre for movida ou capturada em sua casa de origem
        if (origem === 'h1' || destino === 'h1') this.boardService.tabuleiro.direitosRoque.branca.roquePequeno = false;
        if (origem === 'a1' || destino === 'a1') this.boardService.tabuleiro.direitosRoque.branca.roqueGrande = false;
        if (origem === 'h8' || destino === 'h8') this.boardService.tabuleiro.direitosRoque.preta.roquePequeno = false;
        if (origem === 'a8' || destino === 'a8') this.boardService.tabuleiro.direitosRoque.preta.roqueGrande = false;

        return zeraContagemRepeticao;
    }

    /**
     * Execução atômica do movimento.
     * Coordena as fases de checagem, captura, aplicação física e pós-processamento (Xeque/Empate).
     */
    public executarMove(origem: Posicao, destino: Posicao, corDoTurno: Cor, historicoCapturas: string[], promocaoEscolhida?: string): RetornoMovimento {
        
        if (!this.checarMove(origem, destino, corDoTurno)) {
            return { sucesso: false };
        }

        const peca = this.boardService.tabuleiro.getPecaNaCasa(origem);
        if (!peca) return { sucesso: false }; 

        // Detecção de Promoção: Interrompe o fluxo se o usuário ainda não escolheu a peça de destino
        const isPeao = peca.tipo === 'peao';
        const linhaDestino = destino.charAt(1);
        const atingiuUltimaLinha = (peca.cor === 'branca' && linhaDestino === '8') || (peca.cor === 'preta' && linhaDestino === '1');

        if (isPeao && atingiuUltimaLinha && !promocaoEscolhida) {
            return { sucesso: true, requerPromocao: true };
        }

        // Execução da captura (se houver)
        const isCaptura = this.comerPeca(origem, destino, peca, historicoCapturas);

        // Atualização de direitos (Roque/En Passant) e histórico de repetição
        const zeraContagem = this.aplicarConsequenciasFisicas(peca, origem, destino, isCaptura);

        // Transposição física da peça no tabuleiro virtual
        this.boardService.tabuleiro.setPeca(destino, peca);
        this.boardService.tabuleiro.removerPeca(origem);

        const corAdversaria = corDoTurno === 'branca' ? 'preta' : 'branca';

        // Registro de posição para validação de empate por tripla repetição (Agora recebe a cor do adversário, que é quem vai jogar)
        const repeticoes = this.boardService.registrarPosicaoNoHistorico(corAdversaria, zeraContagem);

        // Avaliação de ameaças ao Rei adversário após o lance concluído
        const isXeque = this.boardService.verificarReiEmXeque(corAdversaria);

        return { 
            sucesso: true, 
            isXeque: isXeque, 
            corAdversaria: corAdversaria,
            isEmpateRepeticao: repeticoes >= 3 
        };
    }
}
