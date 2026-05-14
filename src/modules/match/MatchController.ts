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

    /**
     * Inicializa uma nova partida e retorna o estado inicial, incluindo o FEN de abertura.
     */
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

    /**
     * Recupera o estado completo de uma partida ativa na memória.
     * Utilizado para sincronização inicial ou recuperação após refresh do cliente.
     */
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

    /**
     * Retorna a lista de coordenadas válidas para uma peça específica.
     */
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

    /**
     * Processa a tentativa de movimento. Gerencia o estado de "Pausa para Promoção"
     * caso o movimento seja válido mas dependa de uma escolha de peça do usuário.
     */
    public executarMovimento = async (req: Request, res: Response): Promise<any> => {
        try {
            const id = req.params.id as string;
            const { origem, destino, corDoTurnoAtual, historicoCapturas = [], promocao } = req.body;

            const resposta = await this.matchService.executarJogada(id, origem, destino, corDoTurnoAtual, historicoCapturas, promocao);

            if (resposta.sucesso) {
                // Caso o movimento resulte em promoção e a peça ainda não tenha sido definida
                if (resposta.requerPromocao) {
                    return res.json({ 
                        sucesso: true, 
                        requerPromocao: true,
                        mensagem: "Aguardando definição da peça para promoção."
                    });
                }

                // Fluxo padrão para lances comuns ou promoções já definidas
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
}
