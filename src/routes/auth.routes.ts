import { Router } from 'express';
import { ProfileController } from '../modules/profile/ProfileController';

// Recebe o controller instanciado lá do app.ts
export function authRoutes(profileController: ProfileController): Router {
    const router = Router();

    router.post('/login', profileController.login);
    router.post('/cadastrar', profileController.cadastrar);

    return router;
}

