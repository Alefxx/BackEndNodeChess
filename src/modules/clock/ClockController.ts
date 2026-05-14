import { Request, Response } from 'express';
import { MatchService } from '../match/MatchService';

/**
 * Interface de comunicação HTTP para sincronização de tempo.
 */
export class ClockController {
    private matchService: MatchService;

    constructor(matchService: MatchService) {
        this.matchService = matchService;
    }

    /**
     * Endpoint para sincronização dos relógios entre cliente e servidor.
     * Retorna o cálculo exato do tempo restante baseado no timestamp do último lance.
     */
    public sincronizarRelogio = (req: Request, res: Response): any => {
        try {
            const id = req.params.id as string;
            const partida = this.matchService.buscarPartidaAtiva(id);
            
            // Verifica se a partida instanciada possui controle de tempo (ClockService)
            if (!partida.clockService) {
                return res.status(400).json({ 
                    sucesso: false, 
                    erro: 'Controle de tempo não disponível para esta partida.' 
                });
            }

            const tempoReal = partida.clockService.obterTemposReais();

            return res.json({ sucesso: true, tempos: tempoReal });
        } catch (error: any) {
            return res.status(404).json({ 
                sucesso: false, 
                erro: error.message || 'Falha ao localizar partida ativa.' 
            });
        }
    }
}
