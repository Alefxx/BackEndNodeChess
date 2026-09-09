import { VirtualBoard, Posicao, Peca, Cor, ResultadoMovimento } from './VirtualBoard';

export class VirtualBoardService {
    public tabuleiro: VirtualBoard;

    constructor(tabuleiro: VirtualBoard) {
        this.tabuleiro = tabuleiro;
        
        if (this.tabuleiro.estado.size > 0) {
            this.registrarPosicaoNoHistorico('branca');
        }
    }

    public promoverPeca(posicao: string, novoTipo: string): void {
        const peca = this.tabuleiro.getPecaNaCasa(posicao);
        if (peca && peca.tipo === 'peao') {
            peca.tipo = novoTipo as any;
            this.tabuleiro.setPeca(posicao, peca);
        }
    }

    public mover(origem: Posicao, destino: Posicao): ResultadoMovimento {
        const peca = this.tabuleiro.getPecaNaCasa(origem);
        
        if (peca) {
            this.tabuleiro.setPeca(destino, peca);
            this.tabuleiro.removerPeca(origem);
            return { sucesso: true } as ResultadoMovimento;
        }
        
        return { sucesso: false } as ResultadoMovimento;
    }

    public gerarHashPosicao(corDaVez: Cor): string {
        const chavesOrdenadas = Array.from(this.tabuleiro.estado.keys()).sort();
        let hash = '';
        
        for (const pos of chavesOrdenadas) {
            const p = this.tabuleiro.getPecaNaCasa(pos)!;
            hash += `${pos}:${p.cor.charAt(0)}${p.tipo.charAt(0)}|`; 
        }
        
        const roque = this.tabuleiro.direitosRoque;
        hash += `EP:${this.tabuleiro.alvoEnPassant || '-'}|`;
        hash += `RQ:${roque.branca.roquePequeno ? 1:0}${roque.branca.roqueGrande ? 1:0}${roque.preta.roquePequeno ? 1:0}${roque.preta.roqueGrande ? 1:0}|`;
        hash += `T:${corDaVez.charAt(0)}`;
        
        return hash;
    }

    public registrarPosicaoNoHistorico(corDaVez: Cor, zeraContagem: boolean = false): number {
        if (zeraContagem) {
            this.tabuleiro.historicoPosicoes.clear();
        }

        const hashAtual = this.gerarHashPosicao(corDaVez);
        const contagemPosicao = (this.tabuleiro.historicoPosicoes.get(hashAtual) || 0) + 1;
        this.tabuleiro.historicoPosicoes.set(hashAtual, contagemPosicao);

        return contagemPosicao;
    }

    public forcarMovimento(origem: Posicao, destino: Posicao): void {
        const peca = this.tabuleiro.getPecaNaCasa(origem);
        if (peca) { 
            this.tabuleiro.setPeca(destino, peca); 
            this.tabuleiro.removerPeca(origem); 
        }
    }

    public restaurarPeca(posicao: Posicao, peca: Peca): void { 
        this.tabuleiro.setPeca(posicao, peca); 
    }

    public encontrarPosicaoRei(cor: Cor): Posicao | null {
        for (const [posicao, peca] of this.tabuleiro.estado.entries()) {
            if (peca.tipo === 'rei' && peca.cor === cor) return posicao;
        }
        return null;
    }

    public verificarReiEmXeque(corDoRei: Cor): boolean {
        const posicaoRei = this.encontrarPosicaoRei(corDoRei);
        if (!posicaoRei) return false;

        const arquivo = posicaoRei.charCodeAt(0);
        const linha = parseInt(posicaoRei.charAt(1), 10);
        const corInimiga = corDoRei === 'branca' ? 'preta' : 'branca';

        const pulosCavalo: [number, number][] = [ [1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2] ];
        for (const [df, dl] of pulosCavalo) {
            const a = String.fromCharCode(arquivo + df);
            const l = linha + dl;
            if (a >= 'a' && a <= 'h' && l >= 1 && l <= 8) {
                const peca = this.tabuleiro.getPecaNaCasa(`${a}${l}`);
                if (peca && peca.cor === corInimiga && peca.tipo === 'cavalo') return true;
            }
        }

        const retas: [number, number][] = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        for (const [df, dl] of retas) {
            for (let i = 1; i <= 7; i++) {
                const a = String.fromCharCode(arquivo + df * i);
                const l = linha + dl * i;
                if (a < 'a' || a > 'h' || l < 1 || l > 8) break;
                const peca = this.tabuleiro.getPecaNaCasa(`${a}${l}`);
                if (peca) {
                    if (peca.cor === corInimiga && (peca.tipo === 'torre' || peca.tipo === 'rainha')) return true;
                    break;
                }
            }
        }

        const diagonais: [number, number][] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
        for (const [df, dl] of diagonais) {
            for (let i = 1; i <= 7; i++) {
                const a = String.fromCharCode(arquivo + df * i);
                const l = linha + dl * i;
                if (a < 'a' || a > 'h' || l < 1 || l > 8) break;
                const peca = this.tabuleiro.getPecaNaCasa(`${a}${l}`);
                if (peca) {
                    if (peca.cor === corInimiga && (peca.tipo === 'bispo' || peca.tipo === 'rainha')) return true;
                    break; 
                }
            }
        }

        const direcaoInimiga = corDoRei === 'branca' ? 1 : -1;
        const linhaPeao = linha + direcaoInimiga;
        if (linhaPeao >= 1 && linhaPeao <= 8) {
            const colEsq = String.fromCharCode(arquivo - 1);
            const colDir = String.fromCharCode(arquivo + 1);
            if (colEsq >= 'a' && colEsq <= 'h') {
                const peca = this.tabuleiro.getPecaNaCasa(`${colEsq}${linhaPeao}`);
                if (peca && peca.cor === corInimiga && peca.tipo === 'peao') return true;
            }
            if (colDir >= 'a' && colDir <= 'h') {
                const peca = this.tabuleiro.getPecaNaCasa(`${colDir}${linhaPeao}`);
                if (peca && peca.cor === corInimiga && peca.tipo === 'peao') return true;
            }
        }

        const direcoesRei: [number, number][] = [...retas, ...diagonais];
        for (const [df, dl] of direcoesRei) {
            const a = String.fromCharCode(arquivo + df);
            const l = linha + dl;
            if (a >= 'a' && a <= 'h' && l >= 1 && l <= 8) {
                const peca = this.tabuleiro.getPecaNaCasa(`${a}${l}`);
                if (peca && peca.cor === corInimiga && peca.tipo === 'rei') return true;
            }
        }

        return false;
    }
}

