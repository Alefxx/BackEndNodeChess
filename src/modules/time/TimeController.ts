import { Request, Response } from 'express';
import { TimeService } from './TimeService';

export class TimeController {
    private timeService: TimeService;

    constructor(timeService: TimeService) {
        this.timeService = timeService;
    }

    /**
     * Endpoint para listagem de opções de tempo.
     * Formata os dados brutos do banco em um padrão legível para componentes de UI (ex: Seletores).
     */
    public listarOpcoesDeTempo = async (req: Request, res: Response): Promise<any> => {
        try {
            const tempos = await this.timeService.obterTemposAtivos();
            
            // Transforma o objeto do banco em um modelo amigável para o Front-end
            const opcoesFormatadas = tempos.map(t => ({
                id: t.slug,
                label: t.incremento === 0 
                    ? `${t.minutos} min` 
                    : `${t.minutos} | ${t.incremento}`, // Ex: "10 | 5" para 10 min com 5s de incremento
                minutos: t.minutos,
                incremento: t.incremento
            }));

            return res.status(200).json({ sucesso: true, dados: opcoesFormatadas });
        } catch (error) {
            console.error("Erro no TimeController:", error);
            return res.status(500).json({ sucesso: false, erro: 'Falha ao processar solicitação de tempos.' });
        }
    }
}
