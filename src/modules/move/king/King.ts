import { Posicao, Cor } from '../../virtualboard/VirtualBoard';
import { VirtualBoardService } from '../../virtualboard/VirtualBoardService';
import { Move } from '../Move';

export class King extends Move {
    constructor(boardService: VirtualBoardService, corDaPeca: Cor) {
        super(boardService, corDaPeca);
    }

    protected calcularMovimentosBase(origem: Posicao): Posicao[] {
        const movimentosValidos: Posicao[] = [];
        const arquivoInicial = origem.charCodeAt(0);
        const linhaInicial = parseInt(origem.charAt(1), 10);

        const direcoes: [number, number][] = [
            [0, 1], [0, -1], [1, 0], [-1, 0],
            [1, 1], [1, -1], [-1, 1], [-1, -1]
        ];

        for (const [df = 0, dl = 0] of direcoes) {
            const novoArquivo = String.fromCharCode(arquivoInicial + df);
            const novaLinha = linhaInicial + dl;

            if (novoArquivo >= 'a' && novoArquivo <= 'h' && novaLinha >= 1 && novaLinha <= 8) {
                movimentosValidos.push(`${novoArquivo}${novaLinha}` as Posicao);
            }
        }

        // Lógica do Roque
        if (String.fromCharCode(arquivoInicial) === 'e') {
            const direitos = this.tabuleiro.direitosRoque[this.corDaPeca];
            const linha = this.corDaPeca === 'branca' ? 1 : 8;

            // REGRA 1: O rei não pode estar em xeque no momento do roque
            const reiEmXequeAtual = this.boardService.verificarReiEmXeque(this.corDaPeca);

            if (!reiEmXequeAtual) {
                if (direitos.roquePequeno) {
                    const fLivre = this.tabuleiro.getPecaNaCasa(`f${linha}`) === undefined;
                    const gLivre = this.tabuleiro.getPecaNaCasa(`g${linha}`) === undefined;
                    
                    if (fLivre && gLivre) {
                        // REGRA 2: O rei não pode passar por uma casa ameaçada (f)
                        const passaPorXeque = this.deixaReiEmXeque(origem, `f${linha}` as Posicao);
                        if (!passaPorXeque) {
                            movimentosValidos.push(`g${linha}` as Posicao);
                        }
                    }
                }

                if (direitos.roqueGrande) {
                    const dLivre = this.tabuleiro.getPecaNaCasa(`d${linha}`) === undefined;
                    const cLivre = this.tabuleiro.getPecaNaCasa(`c${linha}`) === undefined;
                    const bLivre = this.tabuleiro.getPecaNaCasa(`b${linha}`) === undefined;

                    if (dLivre && cLivre && bLivre) {
                        // REGRA 2: O rei não pode passar por uma casa ameaçada (d)
                        const passaPorXeque = this.deixaReiEmXeque(origem, `d${linha}` as Posicao);
                        if (!passaPorXeque) {
                            movimentosValidos.push(`c${linha}` as Posicao);
                        }
                    }
                }
            }
        }

        return movimentosValidos;
    }
}
