import { Posicao, Cor } from '../../virtualboard/VirtualBoard';
import { VirtualBoardService } from '../../virtualboard/VirtualBoardService';
import { Move } from '../Move';

export class Knight extends Move {
    constructor(boardService: VirtualBoardService, corDaPeca: Cor) {
        super(boardService, corDaPeca);
    }

    protected calcularMovimentosBase(origem: Posicao): Posicao[] {
        const movimentosValidos: Posicao[] = [];
        const arquivoInicial = origem.charCodeAt(0);
        const linhaInicial = parseInt(origem.charAt(1), 10);

        const pulos: [number, number][] = [
            [1, 2], [2, 1], [2, -1], [1, -2],
            [-1, -2], [-2, -1], [-2, 1], [-1, 2]
        ];

        for (const [df = 0, dl = 0] of pulos) {
            const novoArquivo = String.fromCharCode(arquivoInicial + df);
            const novaLinha = linhaInicial + dl;

            if (novoArquivo >= 'a' && novoArquivo <= 'h' && novaLinha >= 1 && novaLinha <= 8) {
                movimentosValidos.push(`${novoArquivo}${novaLinha}`);
            }
        }

        return movimentosValidos;
    }
}
