import { IBot } from './BotModel';
import { BotDAO } from './BotDAO';

/**
 * Serviço responsável por gerenciar os adversários automáticos.
 * Realiza o "seeding" de dificuldades variadas na inicialização.
 */
export class BotService {
    private botDAO: BotDAO;

    constructor(botDAO: BotDAO) {
        this.botDAO = botDAO;
        this.popularBotsDeTeste();
    }

    /**
     * Preenche o banco com perfis de bot se a coleção estiver vazia.
     * Define escalas de dificuldade baseadas nos parâmetros UCI do Stockfish.
     */
    private async popularBotsDeTeste() {
        const count = await this.botDAO.contarBots();
        
        if (count > 0) return;

        console.log("[SEED] Populando catálogo de Bots no MongoDB...");

        const botsIniciais = [
            // Perfil Iniciante: Baixa profundidade e alta probabilidade de lances aleatórios
            { nome: "Iniciante", rating: 200, foto: "/img/bot_1.png", skillLevel: 0, depth: 1, probabilidadeErro: 0.9 },




          { nome: "Amador", rating: 400, foto: "/img/bot_1.png", skillLevel: 0, depth: 1, probabilidadeErro: 0.7 },


          { nome: "Iniciante", rating: 600, foto: "/img/bot_1.png", skillLevel: 0, depth: 1, probabilidadeErro: 0.5 },
            
            // Perfil Amador: Equilíbrio entre erro e técnica básica
            { nome: "Intermediario", rating: 800, foto: "/img/bot_2.png", skillLevel: 0, depth: 1, probabilidadeErro: 0.3 },
            
            // Perfil Avançado: Sem erros propositais, análise de lances moderada
            { nome: "Avançado", rating: 1500, foto: "/img/bot_3.png", skillLevel: 11, depth: 3, probabilidadeErro: 0.0 },
            
            // Perfil Grande Mestre: Configurações máximas da Engine
            { nome: "Grande Mestre", rating: 2800, foto: "/img/bot_4.png", skillLevel: 20, depth: 10, probabilidadeErro: 0.0 }
        ];

        for (const bot of botsIniciais) {
            await this.botDAO.criarBot(bot);
        }
    }

    /**
     * Retorna a lista completa de adversários disponíveis.
     */
    public async listarBotsDisponiveis(): Promise<IBot[]> {
        return await this.botDAO.buscarTodos();
    }
}
