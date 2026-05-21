// src/routes/profile.routes.ts (ajuste o caminho conforme sua estrutura)
import { Router } from 'express';
import { ProfileController } from '../modules/profile/ProfileController';

/**
 * Define as rotas exclusivas para gestão e edição de Perfis.
 * Recebe o controller instanciado lá do app.ts para manter o padrão de injeção.
 */
export function profileRoutes(profileController: ProfileController): Router {
    const router = Router();

    /**
     * Rota de atualização (PUT).
     * O ':username' captura dinamicamente o nome do usuário na URL (ex: /thayna_dev).
     * Essa rota chamará o método que criamos anteriormente no ProfileController.
     */
    router.put('/:username', profileController.atualizarPerfil);

    // Futuramente, você pode adicionar outras rotas aqui, como:
    // router.get('/:username', profileController.buscarPerfil);
    // router.delete('/:username', profileController.deletarConta);

    return router;
}
