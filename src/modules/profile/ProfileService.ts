import { IProfile } from './ProfileModel';
import { ProfileDAO } from './ProfileDAO';

/**
 * Serviço de gerenciamento de perfis e lógica de ranqueamento.
 */
export class ProfileService {
    private profileDAO: ProfileDAO;

    constructor(profileDAO: ProfileDAO) {
        this.profileDAO = profileDAO;
        // Executa o seed de ambiente na inicialização
        this.popularUsuarioDeTeste();
    }

    /**
     * Verifica a integridade do ambiente e cria um usuário mestre para testes
     * caso o banco de dados esteja vazio.
     */
    private async popularUsuarioDeTeste() {
        const count = await this.profileDAO.contarUsuarios();
        
        if (count === 0) {
            await this.profileDAO.criarUsuario({
                nome: "Thayná",
                foto: "/img/img_padrao.jpg",
                rating: 1500,
                username: "thayna_dev",
                senha: "123"
            });
            console.log("[SEED] Perfil administrativo de teste criado com sucesso.");
        }
    }

    /**
     * Orquestra o cadastro de novos usuários aplicando validações de existência.
     */
    public async cadastrarUsuario(dados: Partial<IProfile>): Promise<IProfile> {
        const existe = await this.profileDAO.buscarPorUsername(dados.username!);
        if (existe) {
            throw new Error("O nome de usuário solicitado já está em uso.");
        }
        
        return await this.profileDAO.criarUsuario(dados);
    }

    /**
     * Recupera dados de perfil para processos de autenticação ou visualização.
     */
    public async buscarPorUsername(username: string): Promise<IProfile | null> {
        return await this.profileDAO.buscarPorUsername(username);
    }

    /**
     * Aplica regras de negócio para atualização de Elo.
     * Implementa um 'piso' de rating para evitar valores negativos ou inconsistentes.
     */
    public async atualizarRating(username: string, novoRating: number): Promise<void> {
        const RATING_MINIMO = 100;
        const ratingFinal = novoRating < RATING_MINIMO ? RATING_MINIMO : novoRating;
        
        await this.profileDAO.atualizarRating(username, ratingFinal);
        console.log(`[SERVICE] Rating atualizado: ${username} -> ${ratingFinal}`);
    }
}
