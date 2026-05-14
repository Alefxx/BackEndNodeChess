import { Posicao, Peca, Cor } from '../virtualboard/VirtualBoard';
import { VirtualBoardService } from '../virtualboard/VirtualBoardService';

/**
 * Abstração base para as regras de movimentação.
 * Fornece métodos utilitários para detecção de colisões e simulação de xeque,
 * obrigando as subclasses a implementar a geometria de movimento específica.
 */
export abstract class Move {
    protected boardService: VirtualBoardService;
    public corDaPeca: Cor;

    constructor(boardService: VirtualBoardService, corDaPeca: Cor) {
        this.boardService = boardService;
        this.corDaPeca = corDaPeca;
    }

    /**
     * Getter de conveniência para acesso ao estado bruto do tabuleiro.
     */
    protected get tabuleiro() {
        return this.boardService.tabuleiro;
    }

    /**
     * Calcula os destinos teóricos da peça baseado apenas em sua geometria de movimento.
     */
    protected abstract calcularMovimentosBase(origem: Posicao): Posicao[];

    /**
     * Valida se a casa de destino permite ocupação (vazia ou peça inimiga).
     */
    protected podeOcuparCasa(destino: Posicao): boolean {
        const pecaNoDestino = this.tabuleiro.getPecaNaCasa(destino);
        if (!pecaNoDestino) return true;
        return pecaNoDestino.cor !== this.corDaPeca;
    }

    /**
     * Simula a execução do lance para verificar se o movimento expõe o Rei ao xeque.
     * Este método utiliza um ciclo de "Mover -> Validar -> Desfazer" para manter a integridade.
     */
    protected deixaReiEmXeque(origem: Posicao, destino: Posicao): boolean {
        const pecaDestinoOriginal = this.tabuleiro.getPecaNaCasa(destino);
        
        // Execução do movimento em ambiente controlado (simulação)
        this.boardService.forcarMovimento(origem, destino);
        
        // Avaliação de risco após o movimento
        const emXeque = this.boardService.verificarReiEmXeque(this.corDaPeca);
        
        // Reversão do estado para garantir a imutabilidade do tabuleiro real
        this.boardService.forcarMovimento(destino, origem);
        if (pecaDestinoOriginal) {
            this.boardService.restaurarPeca(destino, pecaDestinoOriginal);
        }
        
        return emXeque;
    }

    /**
     * Filtra a lista de movimentos geométricos aplicando as restrições físicas 
     * e as leis de proteção ao Rei do xadrez.
     */
    public obterMovimentosValidos(origem: Posicao): Posicao[] {
        const movimentosBase = this.calcularMovimentosBase(origem);
        const movimentosLegais: Posicao[] = [];

        for (const destino of movimentosBase) {
            // Um movimento é legal se a casa é acessível e o lance não é suicida (auto-xeque)
            if (this.podeOcuparCasa(destino) && !this.deixaReiEmXeque(origem, destino)) {
                movimentosLegais.push(destino);
            }
        }

        return movimentosLegais;
    }
}
