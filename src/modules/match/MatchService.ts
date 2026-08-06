import { IMatch } from './MatchModel';
import { MatchDAO } from './MatchDAO';
import { VirtualBoard, Posicao } from '../virtualboard/VirtualBoard';
import { VirtualBoardService } from '../virtualboard/VirtualBoardService';
import { BoardController } from '../board/BoardController';
import { MoveController } from '../move/MoveController';
import { MoveService } from '../move/MoveService'; 
import { RegrasService } from '../regras/RegrasService';
import { Promotion } from '../special/Promotion'; 
import { TimeService } from '../time/TimeService';
import { ProfileService } from '../profile/ProfileService';
import { ClockService } from '../clock/ClockService';

/**
 * Estrutura de dados para persistência transitória em memória RAM.
 * Mantém o estado volátil das partidas em andamento para alta performance.
 */
interface PartidaAtiva {
    dbId: string; 
    boardService: VirtualBoardService; 
    clockService: ClockService | null; 
    tempo: any | null; 
    jogadorBrancas: string; 
    jogadorPretas: string;
    pgn: string[]; 
    fenHistory: string[]; // NOVO: A "fita da partida" mantida na memória volátil
    // Atualiza a interface em memória para refletir a possibilidade de sessões presenciais
    tipoPartida: 'bot' | 'multiplayer' | 'local'; 
}

/**
 * Orquestrador central de partidas (MatchService).
 * Gerencia o ciclo de vida completo do jogo, desde a inicialização de estado 
 * até a persistência final e ajuste de Rating (Elo).
 */
export class MatchService {
    private partidasAtivas = new Map<string, PartidaAtiva>();
    private timeService: TimeService;
    private profileService: ProfileService;
    private matchDAO: MatchDAO;

    constructor(timeService: TimeService, profileService: ProfileService, matchDAO: MatchDAO) {
        this.timeService = timeService;
        this.profileService = profileService;
        this.matchDAO = matchDAO;
    }

    /**
     * Inicializa uma instância de partida.
     * Configura perfis, regras de tempo, motor do tabuleiro e persiste o registro inicial no banco.
     */
    // Tipagem atualizada para receber 'local' nos parâmetros de criação
    public async criarNovaPartida(brancasUsername: string, pretasUsername: string, tempoId: string | null, tipoPartida: 'bot' | 'multiplayer' | 'local') {
        const perfilBrancas = await this.profileService.buscarPorUsername(brancasUsername);
        const perfilPretas = await this.profileService.buscarPorUsername(pretasUsername);

        if (tipoPartida === 'multiplayer') {
            if (!perfilBrancas || !perfilPretas) throw new Error('Ambos os jogadores precisam existir para uma partida multiplayer.');
        } else if (tipoPartida === 'bot') {
            if (!perfilBrancas && !perfilPretas) throw new Error('Nenhum jogador humano válido foi encontrado para a partida contra o bot.');
        } else if (tipoPartida === 'local') {
            // Garante que o host (dono do aparelho) esteja autenticado, independentemente de qual cor escolheu jogar, permitindo que o oponente seja um visitante não registrado
            if (!perfilBrancas && !perfilPretas) throw new Error('Pelo menos um jogador registrado precisa iniciar a partida presencial.');
        }

        let controleTempo = null;
        let clockService = null; 

        if (tempoId && tempoId !== 'sem-tempo') {
            controleTempo = await this.timeService.buscarTempoPorSlug(tempoId);
            if (!controleTempo) throw new Error('Controle de tempo inválido.');
            clockService = new ClockService(controleTempo.minutos, controleTempo.incremento);
        }

        const estadoInicial = BoardController.gerarEstadoInicialParaVirtualBoard();
        const virtualBoard = new VirtualBoard(estadoInicial);
        const boardService = new VirtualBoardService(virtualBoard); 

        // NOVO: Extrai o FEN inicial exato (quadro 0 da nossa fita)
        const fenInicial = boardService.tabuleiro.gerarFEN('w');

        const partidaDb = await this.matchDAO.criarPartida({
            jogadorBrancas: brancasUsername,
            jogadorPretas: pretasUsername,
            tempoId: controleTempo ? controleTempo.slug : null,
            tipoPartida: tipoPartida,
            status: 'em_andamento'
        });

        const partidaId = partidaDb._id.toString();
        const partidaCompleta: PartidaAtiva = {
            dbId: partidaId,
            boardService: boardService,
            clockService: clockService, 
            tempo: controleTempo,
            jogadorBrancas: brancasUsername,
            jogadorPretas: pretasUsername,
            pgn: [],
            fenHistory: [fenInicial], // NOVO: Inicia a fita com o quadro 0
            tipoPartida: tipoPartida
        };

        this.partidasAtivas.set(partidaId, partidaCompleta);
        return partidaCompleta;
    }

    /**
     * Recupera a instância ativa da partida através do ID de sessão.
     */
    public buscarPartidaAtiva(partidaId: string): PartidaAtiva {
        const partida = this.partidasAtivas.get(partidaId);
        if (!partida) throw new Error('Partida não localizada em memória volátil.');
        return partida;
    }

    /**
     * Consulta o estado atual do relógio para sincronização de UI.
     */
    public obterTempoDaPartida(partidaId: string) {
        const partida = this.buscarPartidaAtiva(partidaId);
        if (!partida.clockService) return null;
        return partida.clockService.obterTemposReais();
    }

    /**
     * Retorna o mapeamento atual de peças para renderização visual.
     */
    public obterTabuleiroVisual(partidaId: string): Record<string, any> {
        const partida = this.buscarPartidaAtiva(partidaId);
        const snapshotMap = partida.boardService.tabuleiro.obterSnapshot();
        const tabuleiroVisual: Record<string, any> = {};
        snapshotMap.forEach((peca, posicao) => { tabuleiroVisual[posicao] = peca; });
        return tabuleiroVisual;
    }

    /**
     * Delega ao MoveController o cálculo de destinos legais para uma peça.
     */
    public obterMovimentosValidos(partidaId: string, origem: string, corDoTurno: 'branca' | 'preta') {
        const partida = this.buscarPartidaAtiva(partidaId);
        const moveController = new MoveController(partida.boardService);
        return moveController.solicitarCasasPossiveis(origem as Posicao, corDoTurno);
    }

    /**
     * Fluxo de execução de jogada.
     * Coordena validação física, transição de estado, promoção de peões e verificação de fim de jogo.
     */
    public async executarJogada(partidaId: string, origem: string, destino: string, corDoTurno: 'branca' | 'preta', historicoCapturas: string[], promocao?: string) {
        const partida = this.buscarPartidaAtiva(partidaId);
        
        // 1. VALIDAÇÃO CRONOMÉTRICA (Pre-move): Verifica se o tempo expirou antes do lance
        if (partida.clockService) {
            const temposAntes = partida.clockService.obterTemposReais();
            if (temposAntes.fimNoTempo) {
                const vencedorStr = temposAntes.vencedorPorTempo === 'branca' ? 'brancas_vencem' : 'pretas_vencem';
                await this.finalizarPartida(partidaId, vencedorStr);
                return { sucesso: true, statusPartida: { fimDeJogo: true, vencedor: temposAntes.vencedorPorTempo, motivo: 'tempo_esgotado' }, tempos: temposAntes };
            }
        }

        // 2. PROCESSAMENTO FÍSICO: Executa a transposição das peças no motor virtual
        const moveService = new MoveService(partida.boardService);
        const resultado = moveService.executarMove(origem as Posicao, destino as Posicao, corDoTurno, historicoCapturas, promocao);

        // Interrupção para seleção de peça em caso de promoção pendente
        if (resultado.requerPromocao) {
            return { sucesso: true, requerPromocao: true };
        }

        if (!resultado.sucesso) return { sucesso: false };

        // 3. EXECUÇÃO DE PROMOÇÃO: Converte o peão na peça selecionada (Q, R, B, N)
        if (promocao) {
            Promotion.executar(partida.boardService.tabuleiro, destino as Posicao, promocao);
        }

        // 4. PERSISTÊNCIA DE LOG (PGN): Registra o lance na notação oficial do histórico
        let lanceStr = `${origem}-${destino}`;
        if (promocao) lanceStr += `=${promocao.toUpperCase()}`; 
        partida.pgn.push(lanceStr); 

        // 5. ATUALIZAÇÃO DE ESTADO (FEN): Gera a string de estado para o próximo turno
        const proximoTurno = corDoTurno === 'branca' ? 'preta' : 'branca';
        const novoFen = partida.boardService.tabuleiro.gerarFEN(proximoTurno === 'branca' ? 'w' : 'b');
        
        // NOVO: Adiciona o quadro atual na fita da partida
        partida.fenHistory.push(novoFen);

        // 6. ATUALIZAÇÃO DO RELÓGIO (Post-move): Registra o consumo e aplica incrementos
        let temposAtuais = null;
        if (partida.clockService) {
            partida.clockService.registrarLance(corDoTurno, lanceStr);
            temposAtuais = partida.clockService.obterTemposReais();
            
            // Verificação de vitória por tempo imediata
            if (temposAtuais.fimNoTempo) {
                const vencedorStr = temposAtuais.vencedorPorTempo === 'branca' ? 'brancas_vencem' : 'pretas_vencem';
                await this.finalizarPartida(partidaId, vencedorStr);
                return {
                    sucesso: true,
                    detalhes: resultado,
                    statusPartida: { fimDeJogo: true, vencedor: temposAtuais.vencedorPorTempo, motivo: 'tempo_esgotado' },
                    fen: novoFen,
                    pgn: partida.pgn,
                    tempos: temposAtuais
                };
            }
        }

        // 7. AVALIAÇÃO DE CONDIÇÕES DE TÉRMINO (RegrasService)
        const regrasService = new RegrasService(partida.boardService);
        const status = regrasService.analisarStatusGeral(proximoTurno);

        if (status.fimDeJogo) {
            let resultadoFinal: 'brancas_vencem' | 'pretas_vencem' | 'empate' = 'empate';
            if (status.vencedor === 'branca') resultadoFinal = 'brancas_vencem';
            if (status.vencedor === 'preta') resultadoFinal = 'pretas_vencem';
            
            await this.finalizarPartida(partidaId, resultadoFinal);
        }

        return { 
            sucesso: true, 
            detalhes: resultado, 
            statusPartida: status,
            fen: novoFen,
            pgn: partida.pgn,
            tempos: temposAtuais 
        };
    }

    /**
     * Finaliza a sessão da partida.
     * Calcula o ajuste de Elo Rating, persiste o estado final no banco e libera a memória.
     */
    public async finalizarPartida(partidaId: string, resultado: 'brancas_vencem' | 'pretas_vencem' | 'empate') {
        const partida = this.buscarPartidaAtiva(partidaId);
        
        // Isola o recálculo e gravação de Elo exclusivamente para partidas online competitivas. Modalidades como 'local' ou contra 'bot' encerram a sessão sem afetar a pontuação de ranking do jogador.
        if (partida.tipoPartida === 'multiplayer') {
            const perfilBrancas = await this.profileService.buscarPorUsername(partida.jogadorBrancas);
            const perfilPretas = await this.profileService.buscarPorUsername(partida.jogadorPretas);

            if (perfilBrancas && perfilPretas) {
                let pontosBrancas = 0.5; let pontosPretas = 0.5;
                if (resultado === 'brancas_vencem') { pontosBrancas = 1; pontosPretas = 0; } 
                else if (resultado === 'pretas_vencem') { pontosBrancas = 0; pontosPretas = 1; }

                const novoRatingBrancas = this.calcularNovoElo(perfilBrancas.rating, perfilPretas.rating, pontosBrancas);
                const novoRatingPretas = this.calcularNovoElo(perfilPretas.rating, perfilBrancas.rating, pontosPretas);

                await this.profileService.atualizarRating(perfilBrancas.username, novoRatingBrancas);
                await this.profileService.atualizarRating(perfilPretas.username, novoRatingPretas);
            }
        }
        
        const historicoTempos = partida.clockService ? partida.clockService.obterHistoricoDeTempos() : [];
        
        // NOVO: Passando o fenHistory para ser persistido no banco
        await this.matchDAO.finalizarPartida(partida.dbId, resultado, partida.pgn, historicoTempos, partida.fenHistory);
        
        // Liberação de recursos da memória RAM
        this.partidasAtivas.delete(partidaId);
    }

    /**
     * Implementação da fórmula de Rating Elo (K=32).
     * Calcula a variação de pontuação baseada na probabilidade de vitória (expectativa).
     */
    private calcularNovoElo(ratingAtual: number, ratingOponente: number, pontuacao: number): number {
        const K = 32; 
        const expectativa = 1 / (1 + Math.pow(10, (ratingOponente - ratingAtual) / 400));
        return Math.round(ratingAtual + K * (pontuacao - expectativa));
    }

    /**
     * NOVO: Ponto de entrada no Service para delegar o registro da avaliação ao DAO.
     * Ignora se a partida está ativa na memória (Stateless), permitindo atualizações
     * mesmo após a partida ter sido encerrada e removida da RAM.
     */
    public async registrarAvaliacao(partidaId: string, codigo: number): Promise<void> {
        await this.matchDAO.registrarAvaliacao(partidaId, codigo);
    }
}
