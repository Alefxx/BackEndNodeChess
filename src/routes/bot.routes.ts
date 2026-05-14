import { Router } from 'express';
import { BotController } from '../modules/bot/BotController';

/**
 * Define as rotas relacionadas aos Bots adversários.
 * @param botController Instância do controller injetada para manipulação das requisições.
 */
export function botRoutes(botController: BotController): Router {
    const router = Router();

    // Rota GET para listar todos os bots disponíveis e suas configurações

    router.get('/bots', botController.listarBots);

    return router;
}
