import { MatchModel, IMatch } from './MatchModel';

/**
 * Camada de Acesso a Dados (DAO) para entidades de Partida.
 * Isola as operações de persistência do MongoDB.
 */
export class MatchDAO {
    
    /**
     * Persiste o registro inicial da partida no banco de dados.
     */
    public async criarPartida(dados: Partial<IMatch>): Promise<IMatch> {
        return await MatchModel.create(dados);
    }

    /**
     * Finaliza o registro da partida, atualizando o status final,
     * histórico de lances (PGN), posições do tabuleiro (FEN) e logs detalhados do relógio.
     */
    public async finalizarPartida(id: string, status: string, pgn: string[], historicoTempos: string[] = [], fenHistory: string[] = []): Promise<void> {
        await MatchModel.findByIdAndUpdate(id, { 
            status: status,
            pgn: pgn,
            fenHistory: fenHistory, // NOVO: Salvando a "fita da partida" no banco de dados
            historicoTempos: historicoTempos
        });
    }

    /**
     * Recupera os dados persistidos de uma partida através do seu ID.
     */
    public async buscarPartidaPorId(id: string): Promise<IMatch | null> {
        return await MatchModel.findById(id);
    }

    /**
     * Adiciona um código de avaliação gerado pela engine do frontend diretamente ao array da partida.
     * Operação atômica ($push) para garantir segurança e alta performance.
     */
    public async registrarAvaliacao(id: string, codigo: number): Promise<void> {
        await MatchModel.findByIdAndUpdate(id, {
            $push: { analise: codigo.toString() }
        });
    }
}
