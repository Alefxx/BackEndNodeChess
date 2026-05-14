import { Request, Response } from 'express';
import { BotService } from './BotService';

/**
 * Controlador responsável por expor as opções de jogo contra IA.
 */
export class BotController {
    private botService: BotService;

    constructor(botService: BotService) {
        this.botService = botService;
    }

    /**
     * Endpoint para listagem de bots.
     * Formata os dados técnicos de configuração em um objeto consumível pelo Stockfish no cliente.
     */
    public listarBots = async (req: Request, res: Response): Promise<any> => {
        try {
            const bots = await this.botService.listarBotsDisponiveis();
            
            // Mapeamento dos dados brutos para o formato esperado pelo componente React
            const dadosFormatados = bots.map(bot => ({
                id: bot._id,
                nome: bot.nome,
                rating: bot.rating,
                foto: bot.foto,
                configStockfish: {
                    skillLevel: bot.skillLevel,
                    depth: bot.depth,
                    probabilidadeErro: bot.probabilidadeErro
                }
            }));

            return res.status(200).json({ sucesso: true, dados: dadosFormatados });
        } catch (error) {
            console.error("Erro no BotController:", error);
            return res.status(500).json({ sucesso: false, erro: 'Falha ao recuperar catálogo de bots.' });
        }
    }
}
