// src/features/profile/ProfileDAO.ts
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
     * Atualiza os campos editáveis (nome e foto) de um perfil existente no banco de dados.
     * Utiliza o operador $set para garantir uma alteração atômica e segura.
     * @returns {Promise<IProfile | null>} O documento de perfil atualizado ou null se não encontrado.
     */
    public async atualizarPerfil(username: string, dadosAtualizados: { nome: string; foto: string }): Promise<IProfile | null> {
        return await ProfileModel.findOneAndUpdate(
            { username },
            { $set: dadosAtualizados },
            { returnDocument:'after' } // Retorna o documento já com as alterações aplicadas
        );
    }

    /**
     * Atualiza atomicamente o rating (Elo) de um usuário.
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
