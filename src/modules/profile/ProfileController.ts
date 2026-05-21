// src/features/profile/ProfileController.ts
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
            const usuario = await this.profileService.buscarPorUsername(username as string);

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
            
            await this.profileService.cadastrarUsuario({ 
                nome: nome as string, 
                username: username as string, 
                senha: senha as string 
            });
            
            return res.status(201).json({ sucesso: true, mensagem: "Conta criada com sucesso." });
        } catch (error: any) {
            return res.status(400).json({ sucesso: false, erro: error.message });
        }
    }

    /**
     * Endpoint para atualização de dados do perfil (nome e foto).
     */
    public atualizarPerfil = async (req: Request, res: Response): Promise<any> => {
        try {
            // CORREÇÃO: Afirmamos ao TypeScript que os dados recebidos são strings (Type Casting)
            const username = req.params.username as string;
            const nome = req.body.nome as string;
            const foto = req.body.foto as string;

            // Validação básica de entrada (Security by Design)
            if (!nome || !foto) {
                return res.status(400).json({ sucesso: false, erro: 'Nome e foto são campos obrigatórios.' });
            }

            // Agora o TypeScript aceita sem reclamar
            const usuarioAtualizado = await this.profileService.atualizarPerfil(username, nome, foto);

            // Retorna o perfil atualizado, protegendo campos sensíveis como a senha
            return res.status(200).json({
                sucesso: true,
                mensagem: "Perfil atualizado com sucesso.",
                perfil: {
                    nome: usuarioAtualizado?.nome,
                    username: usuarioAtualizado?.username,
                    rating: usuarioAtualizado?.rating,
                    foto: usuarioAtualizado?.foto
                }
            });

        } catch (error: any) {
            if (error.message === "Usuário não encontrado.") {
                return res.status(404).json({ sucesso: false, erro: error.message });
            }
            return res.status(500).json({ sucesso: false, erro: 'Falha interna ao atualizar o perfil.' });
        }
    }
}
