// src/modules/match/MatchController.ts
import { MatchService } from './MatchService';
import { Request, Response } from 'express';

/**
 * Interface de entrada para as operações de partida.
 * Coordena o fluxo entre as requisições HTTP e a lógica de domínio do MatchService.
 */
export class MatchController {
    private matchService: MatchService;

    constructor(matchService: MatchService) {
        this.matchService = matchService;
    }

    public criarPartida = async (req: Request, res: Response): Promise<any> => {
        try {
            const { brancasUsername, pretasUsername, tempoId, tipoPartida } = req.body;

            if (!brancasUsername || !pretasUsername || !tempoId || !tipoPartida) {
                return res.status(400).json({ erro: 'Parâmetros obrigatórios ausentes.' });
            }

            const partida = await this.matchService.criarNovaPartida(brancasUsername, pretasUsername, tempoId, tipoPartida);
            const tabuleiroVisual = this.matchService.obterTabuleiroVisual(partida.dbId);
            const fenRealInicial = partida.boardService.tabuleiro.gerarFEN('w');

            return res.status(201).json({
                sucesso: true,
                partidaId: partida.dbId,
                tipoPartida: partida.tipoPartida,
                jogadores: {
                    brancas: partida.jogadorBrancas,
                    pretas: partida.jogadorPretas
                },
                controleTempo: partida.tempo,
                fen: fenRealInicial,
                tabuleiro: tabuleiroVisual 
            });

        } catch (error: any) {
            return res.status(400).json({ sucesso: false, erro: error.message || 'Erro ao criar partida.' });
        }
    }

    public obterEstado = (req: Request, res: Response): any => {
        try {
            const id = req.params.id as string;
            const partida = this.matchService.buscarPartidaAtiva(id);
            const tabuleiroVisual = this.matchService.obterTabuleiroVisual(id);
            const temposAtuais = this.matchService.obterTempoDaPartida(id);

            return res.json({
                tabuleiro: tabuleiroVisual,
                jogadores: {
                    brancas: partida.jogadorBrancas,
                    pretas: partida.jogadorPretas
                },
                tempos: temposAtuais 
            });
        } catch (error: any) {
            return res.status(404).json({ erro: error.message });
        }
    }

    public obterMovimentos = (req: Request, res: Response): any => {
        try {
            const id = req.params.id as string;
            const origem = req.params.origem as string;
            const corDoTurnoAtual = (req.query.cor as string) || 'branca'; 

            const movimentos = this.matchService.obterMovimentosValidos(id, origem, corDoTurnoAtual as 'branca' | 'preta');
            
            return res.json({
                pecaNaCasa: origem,
                podeIrPara: movimentos
            });
        } catch (error: any) {
            return res.status(404).json({ erro: error.message });
        }
    }

    public executarMovimento = async (req: Request, res: Response): Promise<any> => {
        try {
            const id = req.params.id as string;
            const { origem, destino, corDoTurnoAtual, historicoCapturas = [], promocao } = req.body;

            const resposta = await this.matchService.executarJogada(id, origem, destino, corDoTurnoAtual, historicoCapturas, promocao);

            if (resposta.sucesso) {
                if (resposta.requerPromocao) {
                    return res.json({ 
                        sucesso: true, 
                        requerPromocao: true,
                        mensagem: "Aguardando definição da peça para promoção."
                    });
                }

                return res.json({ 
                    sucesso: true,
                    detalhes: resposta.detalhes, 
                    statusPartida: resposta.statusPartida,
                    fen: resposta.fen, 
                    pgn: resposta.pgn,
                    tempos: resposta.tempos 
                });
            } else {
                return res.status(400).json({ erro: 'Movimento legal não identificado.' });
            }
        } catch (error: any) {
            return res.status(404).json({ erro: error.message });
        }
    }

    /**
     * Recebe a requisição assíncrona do front com a avaliação da jogada (motor Stockfish do cliente).
     * Essa rota é projetada para ser leve, independente do estado em RAM, 
     * focando apenas em adicionar o log analítico (código numérico) ao histórico da partida no banco de dados.
     */
    public registrarAvaliacao = async (req: Request, res: Response): Promise<any> => {
        try {
            const id = req.params.id as string;
            const { codigo } = req.body;

            if (codigo === undefined || codigo === null) {
                return res.status(400).json({ erro: 'Código de avaliação ausente.' });
            }

            await this.matchService.registrarAvaliacao(id, Number(codigo));

            return res.json({ sucesso: true });
        } catch (error: any) {
            return res.status(500).json({ erro: error.message || 'Erro ao registrar avaliação.' });
        }
    }
}
