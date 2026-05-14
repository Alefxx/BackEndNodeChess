import { REGRAS_DE_TEMPO, ITime } from './TimeModel';
import { TimeDAO } from './TimeDAO';

export class TimeService {
    private timeDAO: TimeDAO;

    constructor(timeDAO: TimeDAO) {
        this.timeDAO = timeDAO;
        // Inicia o processo de seeding na inicialização do serviço
        this.popularBancoDeDados();
    }

    /**
     * Verifica se o banco está vazio e popula com as configurações pré-definidas em REGRAS_DE_TEMPO.
     * Garante que o ambiente tenha opções de tempo disponíveis no primeiro boot.
     */
    private async popularBancoDeDados() {
        const count = await this.timeDAO.contarTempos();
        
        if (count > 0) return;

        console.log("🌱 Semeando opções de tempo no MongoDB...");

        for (const [minutosStr, incrementos] of Object.entries(REGRAS_DE_TEMPO)) {
            const minutos = parseInt(minutosStr, 10);

            // Cria a opção de tempo "seco" (sem incremento)
            await this.inserirNoBanco(minutos, 0);

            // Cria as variações com incremento baseadas nas regras
            for (const incremento of incrementos) {
                await this.inserirNoBanco(minutos, incremento);
            }
        }
    }

    /**
     * Gera o slug único e solicita a criação do registro ao DAO.
     */
    private async inserirNoBanco(minutos: number, incremento: number) {
        const slug = `time_${minutos}_${incremento}`;
        try {
            await this.timeDAO.criarTempo({
                slug,
                minutos,
                incremento,
                ativo: true
            } as Partial<ITime>);
        } catch (error) {
            // Silencia erros de duplicidade durante o processo de seed
        }
    }

    /**
     * Retorna a lista de tempos disponíveis para escolha do usuário.
     */
    public async obterTemposAtivos(): Promise<ITime[]> {
        return await this.timeDAO.buscarTodosAtivos();
    }

    /**
     * Recupera uma configuração de tempo detalhada para instanciar uma partida.
     */
    public async buscarTempoPorSlug(slug: string): Promise<ITime | null> {
        return await this.timeDAO.buscarPorSlug(slug);
    }
}
