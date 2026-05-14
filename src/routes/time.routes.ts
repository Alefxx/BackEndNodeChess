import { Router } from 'express';
import { TimeController } from '../modules/time/TimeController';

export function timeRoutes(timeController: TimeController): Router {
    const router = Router();

    // Rota GET para listar as opções de tempo disponíveis
    router.get('/tempos', timeController.listarOpcoesDeTempo);

    return router;
}
