import { Cor, Posicao, Peca } from '../virtualboard/VirtualBoard';
import { VirtualBoardService } from '../virtualboard/VirtualBoardService';
import { MoveController } from '../move/MoveController'; 

export interface StatusJogo {
    fimDeJogo: boolean;
    motivo?: 'xeque-mate' | 'afogamento' | 'repeticao' | 'regra-50-lances' | 'material-insuficiente';
    vencedor?: Cor;
    isXeque: boolean; 
}

export class RegrasService {
    private boardService: VirtualBoardService;
    private moveController: MoveController;

    constructor(boardService: VirtualBoardService) {
        this.boardService = boardService;
        this.moveController = new MoveController(this.boardService);
    }
    
    public analisarStatusGeral(corDaVez: Cor): StatusJogo {
        const emXeque = this.boardService.verificarReiEmXeque(corDaVez);
        const temMovimento = this.jogadorTemMovimentoValido(corDaVez);

        // 1. Verificação de Mate ou Afogamento (Sem lances legais)
        if (!temMovimento) {
            if (emXeque) {
                const corVencedora = corDaVez === 'branca' ? 'preta' : 'branca';
                return { fimDeJogo: true, motivo: 'xeque-mate', vencedor: corVencedora, isXeque: emXeque };
            } else {
                return { fimDeJogo: true, motivo: 'afogamento', isXeque: emXeque }; 
            }
        }

        // 2. NOVO: Verificação de Empate por Material Insuficiente
        if (this.verificarMaterialInsuficiente()) {
            return { fimDeJogo: true, motivo: 'material-insuficiente', isXeque: false };
        }

        // 3. Verificação de empate por tripla repetição usando o Hash Map O(1)
        const hashAtual = this.boardService.gerarHashPosicao(corDaVez);
        const repeticoes = this.boardService.tabuleiro.historicoPosicoes.get(hashAtual) || 0;

        if (repeticoes >= 3) {
            return { fimDeJogo: true, motivo: 'repeticao', isXeque: emXeque };
        }

        return { fimDeJogo: false, isXeque: emXeque };
    }

    /**
     * Verifica se existe ao menos um movimento legal para qualquer peça da cor informada.
     */
    private jogadorTemMovimentoValido(cor: Cor): boolean {
        const snapshot = this.boardService.tabuleiro.obterSnapshot();

        for (const [posicaoOrigem, peca] of snapshot.entries()) {
            if (!posicaoOrigem) continue; 

            if (peca && peca.cor === cor) {
                const movimentosLegais = this.moveController.solicitarCasasPossiveis(posicaoOrigem as Posicao, cor);
                
                if (movimentosLegais.length > 0) {
                    return true; 
                }
            }
        }

        return false; 
    }

    /**
     * Analisa o tabuleiro para determinar se é matematicamente impossível aplicar um Xeque-Mate
     * com as peças restantes.
     */
    private verificarMaterialInsuficiente(): boolean {
        const snapshot = this.boardService.tabuleiro.obterSnapshot();
        const pecas: Peca[] = [];

        // Extrai todas as peças ativas no tabuleiro
        for (const [_, peca] of snapshot.entries()) {
            if (peca) pecas.push(peca);
        }

        // Se existe qualquer Peão, Torre ou Rainha, o mate ainda é possível.
        const temPecaMaiorOuPeao = pecas.some(
            (p) => p.tipo === 'peao' || p.tipo === 'torre' || p.tipo === 'rainha'
        );

        if (temPecaMaiorOuPeao) {
            return false;
        }

        // Se chegou aqui, restam apenas Reis, Bispos e Cavalos.
        const brancasMenores = pecas.filter(p => p.cor === 'branca' && (p.tipo === 'bispo' || p.tipo === 'cavalo'));
        const pretasMenores = pecas.filter(p => p.cor === 'preta' && (p.tipo === 'bispo' || p.tipo === 'cavalo'));

        // Cenário 1: Rei vs Rei (0 peças menores)
        if (brancasMenores.length === 0 && pretasMenores.length === 0) {
            return true;
        }

        // Cenário 2: Rei e (Bispo OU Cavalo) vs Rei
        if (brancasMenores.length === 1 && pretasMenores.length === 0) {
            return true;
        }
        if (pretasMenores.length === 1 && brancasMenores.length === 0) {
            return true;
        }

                // Cenário 3: Rei e Bispo vs Rei e Bispo (Mesma cor de casa)
        // Opcional, mas geralmente aceito na FIDE.
        // Se cada lado tem apenas 1 peça menor e ambas são bispos, é considerado empate na maioria das engines.
        if (brancasMenores.length === 1 && pretasMenores.length === 1) {
            const bBranco = brancasMenores[0];
            const bPreto = pretasMenores[0];
            
            // Usamos o optional chaining (?.) para avisar ao TS que, se for undefined, ele apenas ignora
            if (bBranco?.tipo === 'bispo' && bPreto?.tipo === 'bispo') {
                return true; 
            }
        }

        // Para outras combinações (ex: 2 cavalos vs Rei, Cavalo vs Bispo), o mate é tecnicamente
        // possível (mesmo que conte com um erro crasso do oponente), então não forçamos o empate automático.
        return false;
    }
}


