import { Request, Response } from 'express';
import { ProfileService } from './ProfileService';

/**
 * Controlador responsável por expor as funcionalidades de Perfil via HTTP.
 */
export class ProfileController {
    private profileService: ProfileService;

    constructor(service: ProfileService) {
        this.profileService = service;
    }

    /**
     * Endpoint de autenticação básica.
     * Valida credenciais e retorna o perfil formatado (sem dados sensíveis).
     */
    public login = async (req: Request, res: Response): Promise<any> => {
        try {
            const { username, senha } = req.body;
            const usuario = await this.profileService.buscarPorUsername(username);

            // Verificação de segurança (plaintext para este MVP, recomenda-se Bcrypt futuramente)
            if (usuario && usuario.senha === senha) {
                return res.status(200).json({ 
                    sucesso: true, 
                    perfil: {
                        nome: usuario.nome,
                        username: usuario.username,
                        rating: usuario.rating,
                        foto: usuario.foto
                    }
                });
            }

            return res.status(401).json({ sucesso: false, erro: "Credenciais de acesso inválidas." });
        } catch (error: any) {
            return res.status(500).json({ sucesso: false, erro: 'Falha interna durante a autenticação.' });
        }
    }

    /**
     * Endpoint para criação de novas contas de usuário.
     */
    public cadastrar = async (req: Request, res: Response): Promise<any> => {
        try {
            const { nome, username, senha } = req.body;
            
            await this.profileService.cadastrarUsuario({ nome, username, senha });
            
            return res.status(201).json({ sucesso: true, mensagem: "Conta criada com sucesso." });
        } catch (error: any) {
            return res.status(400).json({ sucesso: false, erro: error.message });
        }
    }
}
