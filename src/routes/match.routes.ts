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
    
    // NOVO: Ação assíncrona pós/durante o jogo para salvar as avaliações da engine
    router.post('/partida/:id/avaliacao', matchController.registrarAvaliacao);

    return router;
}
