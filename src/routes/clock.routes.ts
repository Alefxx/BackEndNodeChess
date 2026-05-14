// src/modules/clock/clockRoutes.ts
import { Router } from 'express';
import { ClockController } from '../modules/clock/ClockController';

export function clockRoutes(clockController: ClockController): Router {
    const router = Router();

    // perguntar os segundos exatos a qualquer momento
    router.get('/partida/:id/tempo', clockController.sincronizarRelogio);

    return router;
}
