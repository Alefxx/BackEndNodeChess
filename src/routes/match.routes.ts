import { Router } from 'express';
import { MatchController } from '../modules/match/MatchController';

export function matchRoutes(matchController: MatchController): Router {
    const router = Router();

    // Cria a partida
    router.post('/partida/nova', matchController.criarPartida);
    
    // Ações durante o jogo
    router.get('/partida/:id/estado', matchController.obterEstado);
    router.get('/partida/:id/movimentos/:origem', matchController.obterMovimentos);
    router.post('/partida/:id/mover', matchController.executarMovimento);

    return router;
}
