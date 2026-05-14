import { Posicao, Cor, TipoPeca } from '../virtualboard/VirtualBoard';
import { VirtualBoardService } from '../virtualboard/VirtualBoardService';
import { Move } from './Move';

// Implementações específicas de cada peça
import { Pawn } from './pawn/Pawn';
import { Rook } from './rook/Rook';
import { Knight } from './knight/Knight';
import { Bishop } from './bishop/Bishop';
import { Queen } from './queen/Queen';
import { King } from './king/King';

/**
 * Controlador de Regras de Movimentação.
 * Atua como uma fábrica de estratégias, delegando o cálculo de casas 
 * acessíveis para as classes específicas de cada peça.
 */
export class MoveController {
    private boardService: VirtualBoardService;

    constructor(boardService: VirtualBoardService) {
        this.boardService = boardService;
    }

    /**
     * Factory Method: Instancia a classe de comportamento correspondente ao tipo da peça.
     * Implementa o padrão Strategy para isolar as regras geométricas de cada peça.
     */
    private instanciarEstrategiaPeca(tipo: TipoPeca, cor: Cor): Move | null {
        switch (tipo) {
            case 'peao': return new Pawn(this.boardService, cor);
            case 'torre': return new Rook(this.boardService, cor);
            case 'cavalo': return new Knight(this.boardService, cor);
            case 'bispo': return new Bishop(this.boardService, cor);
            case 'rainha': return new Queen(this.boardService, cor);
            case 'rei': return new King(this.boardService, cor);
            default: return null;
        }
    }

    /**
     * Resolve a lista de destinos possíveis para uma peça em uma coordenada de origem.
     * Valida a existência da peça e a correspondência com a cor do turno ativo.
     * 
     * @param origem Coordenada de partida da peça.
     * @param corDoTurnoAtual Cor do jogador que detém a vez.
     * @returns Array de strings representando as coordenadas das casas válidas.
     */
    public solicitarCasasPossiveis(origem: Posicao, corDoTurnoAtual: Cor): Posicao[] {
        const peca = this.boardService.tabuleiro.getPecaNaCasa(origem);

        // Validação de integridade: a casa deve conter uma peça pertencente ao jogador da vez
        if (!peca || peca.cor !== corDoTurnoAtual) {
            return [];
        }

        const estrategiaMovimento = this.instanciarEstrategiaPeca(peca.tipo, peca.cor);
        if (!estrategiaMovimento) return [];

        return estrategiaMovimento.obterMovimentosValidos(origem);
    }
}
