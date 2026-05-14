import { BotModel, IBot } from './BotModel';

/**
 * Data Access Object (DAO) para o modelo de Bot.
 * Abstrai as consultas ao MongoDB.
 */
export class BotDAO {
    
    /**
     * Retorna a quantidade total de bots cadastrados no banco.
     */
    public async contarBots(): Promise<number> {
        return await BotModel.countDocuments();
    }

    /**
     * Persiste um novo registro de Bot.
     */
    public async criarBot(dados: Partial<IBot>): Promise<IBot> {
        return await BotModel.create(dados);
    }

    /**
     * Recupera todos os bots ordenados por nível de rating.
     */
    public async buscarTodos(): Promise<IBot[]> {
        return await BotModel.find().sort({ rating: 1 });
    }

    /**
     * Localiza um bot específico através de seu ID único.
     */
    public async buscarPorId(id: string): Promise<IBot | null> {
        return await BotModel.findById(id);
    }
}
