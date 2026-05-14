import { RelogioEstado, ResultadoTempo } from './ClockModel';

/**
 * Gerencia a lógica de tempo de uma partida de xadrez (Relógio de Fischer).
 * Responsável pelo cálculo de consumo, aplicação de incrementos e controle de flag (queda de seta).
 */
export class ClockService {
    private estado: RelogioEstado;
    private registroTempos: string[] = []; 
    private numeroLance: number = 1;

    /**
     * @param minutosIniciais Tempo total de partida por jogador.
     * @param incremento Segundos adicionados ao relógio após cada lance.
     */
    constructor(minutosIniciais: number, incremento: number) {
        const segundosIniciais = minutosIniciais * 60;
        this.estado = {
            brancasRestante: segundosIniciais,
            pretasRestante: segundosIniciais,
            incremento: incremento,
            ativo: false,
            turnoAtual: 'branca',
            ultimoTimestamp: null
        };
    }

    /**
     * Converte o saldo de segundos em string formatada (MM:SS).
     */
    private formatarTempo(segundos: number): string {
        const min = Math.floor(segundos / 60);
        const seg = Math.floor(segundos % 60);
        return `${min.toString().padStart(2, '0')}:${seg.toString().padStart(2, '0')}`;
    }

    /**
     * Registra o lance e atualiza o saldo de tempo do jogador.
     * Implementa a regra oficial: se o tempo expirar antes da conclusão do lance, 
     * o saldo é zerado e o incremento não é aplicado (queda de seta).
     */
    public registrarLance(corQueJogou: 'branca' | 'preta', lance: string): void {
        const agora = Date.now();

        // Inicialização do relógio no primeiro lance das Brancas
        if (!this.estado.ativo && corQueJogou === 'branca') {
            this.estado.ativo = true;
            this.estado.turnoAtual = 'preta';
            this.estado.ultimoTimestamp = agora; 
            
            // Aplicação de incremento inicial conforme configuração da partida
            this.estado.brancasRestante += this.estado.incremento;
            
            this.registroTempos.push(
                `L${this.numeroLance} Brancas: ${lance} aos ${this.formatarTempo(this.estado.brancasRestante)}`
            );
            return;
        }

        if (!this.estado.ativo || !this.estado.ultimoTimestamp) return;

        const tempoGasto = (agora - this.estado.ultimoTimestamp) / 1000;

        if (corQueJogou === 'branca') {
            const saldo = this.estado.brancasRestante - tempoGasto;
            
            // Validação de esgotamento de tempo antes do incremento
            this.estado.brancasRestante = saldo <= 0 ? 0 : saldo + this.estado.incremento;
            this.estado.turnoAtual = 'preta';
            
            this.registroTempos.push(
                `L${this.numeroLance} Brancas: ${lance} aos ${this.formatarTempo(this.estado.brancasRestante)}`
            );
        } else {
            const saldo = this.estado.pretasRestante - tempoGasto;
            
            this.estado.pretasRestante = saldo <= 0 ? 0 : saldo + this.estado.incremento;
            this.estado.turnoAtual = 'branca';
            
            this.registroTempos.push(
                `L${this.numeroLance} Pretas: ${lance} aos ${this.formatarTempo(this.estado.pretasRestante)}`
            );
            this.numeroLance++; 
        }

        this.estado.ultimoTimestamp = agora;
    }

    /**
     * Retorna o log de tempos acumulado durante a partida.
     */
    public obterHistoricoDeTempos(): string[] {
        return this.registroTempos;
    }

    /**
     * Calcula o tempo atualizado em tempo real (on-the-fly).
     * Subtrai o tempo decorrido desde o último lance do saldo do jogador da vez.
     */
    public obterTemposReais(): ResultadoTempo {
        if (!this.estado.ativo || !this.estado.ultimoTimestamp) {
            return { 
                brancas: this.estado.brancasRestante, 
                pretas: this.estado.pretasRestante, 
                fimNoTempo: false, 
                vencedorPorTempo: null 
            };
        }

        const agora = Date.now();
        const tempoGasto = (agora - this.estado.ultimoTimestamp) / 1000;

        let brancasAtual = this.estado.brancasRestante;
        let pretasAtual = this.estado.pretasRestante;

        // Deduz o tempo do jogador que está com o turno ativo
        if (this.estado.turnoAtual === 'branca') {
            brancasAtual = Math.max(0, brancasAtual - tempoGasto);
        } else {
            pretasAtual = Math.max(0, pretasAtual - tempoGasto);
        }

        return {
            brancas: Math.round(brancasAtual),
            pretas: Math.round(pretasAtual),
            fimNoTempo: brancasAtual <= 0 || pretasAtual <= 0,
            vencedorPorTempo: brancasAtual <= 0 ? 'preta' : (pretasAtual <= 0 ? 'branca' : null)
        };
    }
}
