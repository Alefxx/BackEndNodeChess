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
    turnoAtual: 'branca' | 'preta'; // NOVO: Controle seguro do turno pelo Backend
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
    public async criarNovaPartida(brancasUsername: string, pretasUsername: string, tempoId: string | null, tipoPartida: 'bot' | 'multiplayer' | 'local') {
        const perfilBrancas = await this.profileService.buscarPorUsername(brancasUsername);
        const perfilPretas = await this.profileService.buscarPorUsername(pretasUsername);

        if (tipoPartida === 'multiplayer') {
            if (!perfilBrancas || !perfilPretas) throw new Error('Ambos os jogadores precisam existir para uma partida multiplayer.');
        } else if (tipoPartida === 'bot') {
            if (!perfilBrancas && !perfilPretas) throw new Error('Nenhum jogador humano válido foi encontrado para a partida contra o bot.');
        } else if (tipoPartida === 'local') {
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
            turnoAtual: 'branca', // Inicializa o turno com as brancas
            tipoPartida: tipoPartida
        };

        this.partidasAtivas.set(partidaId, partidaCompleta);
        return partidaCompleta;
    }

    public buscarPartidaAtiva(partidaId: string): PartidaAtiva {
        const partida = this.partidasAtivas.get(partidaId);
        if (!partida) throw new Error('Partida não localizada em memória volátil.');
        return partida;
    }

    public obterTempoDaPartida(partidaId: string) {
        const partida = this.buscarPartidaAtiva(partidaId);
        if (!partida.clockService) return null;
        return partida.clockService.obterTemposReais();
    }

    public obterTabuleiroVisual(partidaId: string): Record<string, any> {
        const partida = this.buscarPartidaAtiva(partidaId);
        const snapshotMap = partida.boardService.tabuleiro.obterSnapshot();
        const tabuleiroVisual: Record<string, any> = {};
        snapshotMap.forEach((peca, posicao) => { tabuleiroVisual[posicao] = peca; });
        return tabuleiroVisual;
    }

    public obterMovimentosValidos(partidaId: string, origem: string) {
        const partida = this.buscarPartidaAtiva(partidaId);
        const moveController = new MoveController(partida.boardService);
        // Utiliza o turno armazenado na sessão, ignorando solicitações forjadas do cliente
        return moveController.solicitarCasasPossiveis(origem as Posicao, partida.turnoAtual);
    }

    /**
     * Fluxo de execução de jogada.
     * Modificado para não receber a cor do turno como parâmetro (garante a segurança).
     */
    public async executarJogada(partidaId: string, origem: string, destino: string, historicoCapturas: string[], promocao?: string) {
        const partida = this.buscarPartidaAtiva(partidaId);
        const corDoTurno = partida.turnoAtual; // Leitura direta da autoridade de estado
        
        // 1. VALIDAÇÃO CRONOMÉTRICA
        if (partida.clockService) {
            const temposAntes = partida.clockService.obterTemposReais();
            if (temposAntes.fimNoTempo) {
                const vencedorStr = temposAntes.vencedorPorTempo === 'branca' ? 'brancas_vencem' : 'pretas_vencem';
                await this.finalizarPartida(partidaId, vencedorStr);
                return { sucesso: true, statusPartida: { fimDeJogo: true, vencedor: temposAntes.vencedorPorTempo, motivo: 'tempo_esgotado' }, tempos: temposAntes };
            }
        }

        // 2. PROCESSAMENTO FÍSICO
        const moveService = new MoveService(partida.boardService);
        const resultado = moveService.executarMove(origem as Posicao, destino as Posicao, corDoTurno, historicoCapturas, promocao);

        if (resultado.requerPromocao) {
            return { sucesso: true, requerPromocao: true };
        }

        if (!resultado.sucesso) return { sucesso: false };

        // 3. EXECUÇÃO DE PROMOÇÃO
        if (promocao) {
            Promotion.executar(partida.boardService.tabuleiro, destino as Posicao, promocao);
        }

        // 4. PERSISTÊNCIA DE LOG (PGN)
        let lanceStr = `${origem}-${destino}`;
        if (promocao) lanceStr += `=${promocao.toUpperCase()}`; 
        partida.pgn.push(lanceStr); 

        // 5. ATUALIZAÇÃO DE ESTADO
        // Alterna o turno na memória do servidor
        partida.turnoAtual = corDoTurno === 'branca' ? 'preta' : 'branca';
        
        const novoFen = partida.boardService.tabuleiro.gerarFEN(partida.turnoAtual === 'branca' ? 'w' : 'b');

        // 6. ATUALIZAÇÃO DO RELÓGIO
        let temposAtuais = null;
        if (partida.clockService) {
            partida.clockService.registrarLance(corDoTurno, lanceStr);
            temposAtuais = partida.clockService.obterTemposReais();
            
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

        // 7. AVALIAÇÃO DE CONDIÇÕES DE TÉRMINO
        const regrasService = new RegrasService(partida.boardService);
        const status = regrasService.analisarStatusGeral(partida.turnoAtual);

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
     * Processa a desistência voluntária de um jogador.
     */
    public async desistirPartida(partidaId: string, corQueDesistiu: 'branca' | 'preta') {
        // Encontra a partida (se não achar, vai disparar o erro padrão)
        this.buscarPartidaAtiva(partidaId);
        
        // Se as brancas desistem, pretas vencem, e vice-versa.
        const vencedor = corQueDesistiu === 'branca' ? 'preta' : 'branca';
        const resultadoFinal = vencedor === 'branca' ? 'brancas_vencem' : 'pretas_vencem';
        
        // Salva a partida, calcula Elo e limpa da memória
        await this.finalizarPartida(partidaId, resultadoFinal);
        
        // Retorna o status no formato que o Frontend (useGameRulesMatch) entende
        return {
            fimDeJogo: true,
            vencedor: vencedor,
            motivo: 'abandono'
        };
    }

    public async finalizarPartida(partidaId: string, resultado: 'brancas_vencem' | 'pretas_vencem' | 'empate') {
        const partida = this.buscarPartidaAtiva(partidaId);
        
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
        
        await this.matchDAO.finalizarPartida(partida.dbId, resultado, partida.pgn, historicoTempos, []);
        
        this.partidasAtivas.delete(partidaId);
    }

    private calcularNovoElo(ratingAtual: number, ratingOponente: number, pontuacao: number): number {
        const K = 32; 
        const expectativa = 1 / (1 + Math.pow(10, (ratingOponente - ratingAtual) / 400));
        return Math.round(ratingAtual + K * (pontuacao - expectativa));
    }

    public async registrarAvaliacao(partidaId: string, codigo: number): Promise<void> {
        await this.matchDAO.registrarAvaliacao(partidaId, codigo);
    }
}
