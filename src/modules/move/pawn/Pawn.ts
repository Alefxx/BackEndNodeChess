import { Posicao, Cor } from '../../virtualboard/VirtualBoard';
import { VirtualBoardService } from '../../virtualboard/VirtualBoardService';
import { Move } from '../Move';

export class Pawn extends Move {
    
    constructor(boardService: VirtualBoardService, corDaPeca: Cor) {
        super(boardService, corDaPeca);
    }

    protected calcularMovimentosBase(origem: Posicao): Posicao[] {
        const movimentosValidos: Posicao[] = [];
        
        const arquivo = origem.charAt(0); 
        const linha = parseInt(origem.charAt(1), 10); 
        
        const direcao = this.corDaPeca === 'branca' ? 1 : -1;
        const linhaInicial = this.corDaPeca === 'branca' ? 2 : 7;

        const frente1 = `${arquivo}${linha + direcao}`;
        
        if (this.tabuleiro.getPecaNaCasa(frente1) === undefined) {
            movimentosValidos.push(frente1);

            if (linha === linhaInicial) {
                const frente2 = `${arquivo}${linha + (direcao * 2)}`;
                if (this.tabuleiro.getPecaNaCasa(frente2) === undefined) {
                    movimentosValidos.push(frente2);
                }
            }
        }

        const colunasCaptura = [
            String.fromCharCode(arquivo.charCodeAt(0) - 1),
            String.fromCharCode(arquivo.charCodeAt(0) + 1)  
        ];

        for (const col of colunasCaptura) {
            if (col >= 'a' && col <= 'h') {
                const casaDiagonal = `${col}${linha + direcao}`;
                const pecaDestino = this.tabuleiro.getPecaNaCasa(casaDiagonal);
                const alvoEnPassant = this.tabuleiro.alvoEnPassant;
                
                const isCapturaValida = pecaDestino && pecaDestino.cor !== this.corDaPeca;
                const isEnPassant = alvoEnPassant === casaDiagonal;

                if (isCapturaValida || isEnPassant) {
                    movimentosValidos.push(casaDiagonal);
                }
            }
        }

        return movimentosValidos;
    }
}
