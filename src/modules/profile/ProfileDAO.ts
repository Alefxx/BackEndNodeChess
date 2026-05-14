import { ProfileModel, IProfile } from './ProfileModel';

/**
 * Data Access Object (DAO) para o modelo de Perfil.
 * Encapsula operações CRUD para evitar dependência direta do Mongoose nos serviços.
 */
export class ProfileDAO {
    
    /**
     * Localiza um documento de perfil através do identificador único username.
     */
    public async buscarPorUsername(username: string): Promise<IProfile | null> {
        return await ProfileModel.findOne({ username });
    }

    /**
     * Persiste um novo registro de usuário no banco de dados.
     */
    public async criarUsuario(dados: Partial<IProfile>): Promise<IProfile> {
        return await ProfileModel.create(dados);
    }

    /**
     * Atualiza atomicamente o rating de um usuário.
     */
    public async atualizarRating(username: string, novoRating: number): Promise<void> {
        await ProfileModel.updateOne({ username }, { rating: novoRating });
    }

    /**
     * Retorna a volumetria total de usuários cadastrados.
     */
    public async contarUsuarios(): Promise<number> {
        return await ProfileModel.countDocuments();
    }
}
