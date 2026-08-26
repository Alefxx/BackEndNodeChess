import { VirtualBoard, Posicao, Peca, Cor } from './VirtualBoard';

/**
 * Gerencia o estado físico e consultas analíticas do tabuleiro.
 * Focado em detecção de xeque, histórico de posições e manipulação de peças.
 */
export class VirtualBoardService {
    public tabuleiro: VirtualBoard;

    constructor(tabuleiro: VirtualBoard) {
        this.tabuleiro = tabuleiro;
        
        if (this.tabuleiro.estado.size > 0) {
            this.registrarPosicaoNoHistorico('branca'); // <-- Turno inicial fixado como branca
        }
    }

    /**
     * Serializa o estado atual para verificação de empate por tripla repetição.
     * Inclui peças, direitos de roque, alvo de captura en passant e o turno atual.
     */
    public gerarHashPosicao(corDaVez: Cor): string { // <-- Recebe corDaVez
        const chavesOrdenadas = Array.from(this.tabuleiro.estado.keys()).sort();
        let hash = '';
        
        for (const pos of chavesOrdenadas) {
            const p = this.tabuleiro.getPecaNaCasa(pos)!;
            hash += `${pos}:${p.cor.charAt(0)}${p.tipo.charAt(0)}|`; 
        }
        
        const roque = this.tabuleiro.direitosRoque;
        hash += `EP:${this.tabuleiro.alvoEnPassant || '-'}|`;
        hash += `RQ:${roque.branca.roquePequeno ? 1:0}${roque.branca.roqueGrande ? 1:0}${roque.preta.roquePequeno ? 1:0}${roque.preta.roqueGrande ? 1:0}|`;
        hash += `T:${corDaVez.charAt(0)}`; // <-- NOVO: Adiciona o Turno ('b' ou 'p') ao Hash
        
        return hash;
    }

    /**
     * Incrementa o contador de ocorrências da posição atual.
     * @param corDaVez Cor do jogador que tem o turno na posição atual.
     * @param zeraContagem Deve ser true em capturas ou lances de peão (regra dos 50 lances).
     */
    public registrarPosicaoNoHistorico(corDaVez: Cor, zeraContagem: boolean = false): number { // <-- Recebe corDaVez
        if (zeraContagem) {
            this.tabuleiro.historicoPosicoes.clear();
        }

        const hashAtual = this.gerarHashPosicao(corDaVez);
        const contagemPosicao = (this.tabuleiro.historicoPosicoes.get(hashAtual) || 0) + 1;
        this.tabuleiro.historicoPosicoes.set(hashAtual, contagemPosicao);

        return contagemPosicao;
    }

    /**
     * Movimentação forçada para lances secundários (ex: Torre no Roque).
     */
    public forcarMovimento(origem: Posicao, destino: Posicao): void {
        const peca = this.tabuleiro.getPecaNaCasa(origem);
        if (peca) { 
            this.tabuleiro.setPeca(destino, peca); 
            this.tabuleiro.removerPeca(origem); 
        }
    }

    /**
     * Restaura uma peça em uma casa específica. Útil para desfazer simulações de xeque.
     */
    public restaurarPeca(posicao: Posicao, peca: Peca): void { 
        this.tabuleiro.setPeca(posicao, peca); 
    }

    /**
     * Localiza a coordenada atual do Rei da cor solicitada.
     */
    public encontrarPosicaoRei(cor: Cor): Posicao | null {
        for (const [posicao, peca] of this.tabuleiro.estado.entries()) {
            if (peca.tipo === 'rei' && peca.cor === cor) return posicao;
        }
        return null;
    }

    /**
     * Verifica se o Rei está sob ataque direto de peças inimigas.
     * Utiliza técnica de busca reversa a partir da posição do Rei.
     */
    public verificarReiEmXeque(corDoRei: Cor): boolean {
        const posicaoRei = this.encontrarPosicaoRei(corDoRei);
        if (!posicaoRei) return false;

        const arquivo = posicaoRei.charCodeAt(0);
        const linha = parseInt(posicaoRei.charAt(1), 10);
        const corInimiga = corDoRei === 'branca' ? 'preta' : 'branca';

        // 1. Saltos de Cavalo
        const pulosCavalo: [number, number][] = [ [1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2] ];
        for (const [df, dl] of pulosCavalo) {
            const a = String.fromCharCode(arquivo + df);
            const l = linha + dl;
            if (a >= 'a' && a <= 'h' && l >= 1 && l <= 8) {
                const peca = this.tabuleiro.getPecaNaCasa(`${a}${l}`);
                if (peca && peca.cor === corInimiga && peca.tipo === 'cavalo') return true;
            }
        }

        // 2. Linhas e Colunas (Torres e Rainhas)
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

        // 3. Diagonais (Bispos e Rainhas)
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

        // 4. Peões Inimigos (Ataque diagonal)
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

        // 5. Rei Inimigo (Adjacência proibida)
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
