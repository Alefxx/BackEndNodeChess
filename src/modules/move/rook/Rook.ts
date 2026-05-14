import { Posicao, Cor } from '../../virtualboard/VirtualBoard';
import { VirtualBoardService } from '../../virtualboard/VirtualBoardService';
import { Move } from '../Move';

export class Rook extends Move {
    constructor(boardService: VirtualBoardService, corDaPeca: Cor) {
        super(boardService, corDaPeca);
    }

    protected calcularMovimentosBase(origem: Posicao): Posicao[] {
        const movimentosValidos: Posicao[] = [];
        const arquivoInicial = origem.charCodeAt(0);
        const linhaInicial = parseInt(origem.charAt(1), 10);

        const direcoes: [number, number][] = [
            [0, 1], [0, -1], [1, 0], [-1, 0]
        ];

        for (const [df = 0, dl = 0] of direcoes) {
            for (let i = 1; i <= 7; i++) {
                const novoArquivo = String.fromCharCode(arquivoInicial + df * i);
                const novaLinha = linhaInicial + dl * i;

                if (novoArquivo < 'a' || novoArquivo > 'h' || novaLinha < 1 || novaLinha > 8) break;

                const casa = `${novoArquivo}${novaLinha}`;
                movimentosValidos.push(casa);

                if (this.tabuleiro.getPecaNaCasa(casa) !== undefined) break; 
            }
        }

        return movimentosValidos;
    }
}
