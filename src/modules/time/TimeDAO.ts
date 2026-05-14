import { TimeModel, ITime } from './TimeModel';

export class TimeDAO {
    
    /**
     * Retorna a quantidade total de documentos na coleção de tempos.
     */
    public async contarTempos(): Promise<number> {
        return await TimeModel.countDocuments();
    }

    /**
     * Persiste uma nova configuração de tempo no banco de dados.
     */
    public async criarTempo(dados: Partial<ITime>): Promise<ITime> {
        return await TimeModel.create(dados);
    }

    /**
     * Recupera todas as configurações de tempo marcadas como ativas.
     */
    public async buscarTodosAtivos(): Promise<ITime[]> {
        return await TimeModel.find({ ativo: true });
    }

    /**
     * Localiza uma configuração específica através de seu identificador slug.
     */
    public async buscarPorSlug(slug: string): Promise<ITime | null> {
        return await TimeModel.findOne({ slug });
    }
}
