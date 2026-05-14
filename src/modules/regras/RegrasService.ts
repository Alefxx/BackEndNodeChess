import { Cor } from '../virtualboard/VirtualBoard';
import { VirtualBoardService } from '../virtualboard/VirtualBoardService';
import { MoveController } from '../move/MoveController'; 

/**
 * Representa o estado consolidado da partida após uma avaliação de regras.
 */
export interface StatusJogo {
    fimDeJogo: boolean;
    motivo?: 'xeque-mate' | 'afogamento';
    vencedor?: Cor;
    isXeque: boolean; 
}

/**
 * Serviço responsável por validar condições de término de jogo e ameaças ao Rei.
 */
export class RegrasService {
    private boardService: VirtualBoardService;
    private moveController: MoveController;

    constructor(boardService: VirtualBoardService) {
        this.boardService = boardService;
        this.moveController = new MoveController(this.boardService);
    }
    
    /**
     * Avalia a situação do jogador atual para determinar se o jogo deve ser encerrado.
     * @param corDaVez A cor do jogador que deve realizar o próximo movimento.
     */
    public analisarStatusGeral(corDaVez: Cor): StatusJogo {
        const emXeque = this.boardService.verificarReiEmXeque(corDaVez);
        const temMovimento = this.jogadorTemMovimentoValido(corDaVez);

        // Cenário de fim de jogo: o jogador não possui lances legais disponíveis
        if (!temMovimento) {
            if (emXeque) {
                // Bloqueio total sob ataque caracteriza Xeque-Mate
                const corVencedora = corDaVez === 'branca' ? 'preta' : 'branca';
                return { 
                    fimDeJogo: true, 
                    motivo: 'xeque-mate', 
                    vencedor: corVencedora, 
                    isXeque: emXeque 
                };
            } else {
                // Bloqueio total sem ataque caracteriza Afogamento (Stalemate)
                return { 
                    fimDeJogo: true, 
                    motivo: 'afogamento', 
                    isXeque: emXeque 
                }; 
            }
        }

        // Partida segue normalmente; isXeque informa se há um xeque simples em curso
        return { fimDeJogo: false, isXeque: emXeque };
    }

    /**
     * Verifica se existe ao menos um movimento legal para qualquer peça da cor informada.
     */
    private jogadorTemMovimentoValido(cor: Cor): boolean {
        const snapshot = this.boardService.tabuleiro.obterSnapshot();

        for (const [posicaoOrigem, peca] of snapshot.entries()) {
            if (peca.cor === cor) {
                const movimentosLegais = this.moveController.solicitarCasasPossiveis(posicaoOrigem, cor);
                
                // Retorna verdadeiro assim que o primeiro lance legal é encontrado (otimização de busca)
                if (movimentosLegais.length > 0) {
                    return true; 
                }
            }
        }

        return false; 
    }
}
