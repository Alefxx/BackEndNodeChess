import { Schema, model, Document } from 'mongoose';

/**
 * Interface representativa do documento Match no MongoDB.
 */
export interface IMatch extends Document {
    pgn: string[];             // Histórico de lances em notação algébrica
    fenHistory: string[];      // Histórico de estados do tabuleiro (a "fita da partida" quadro a quadro)
    historicoTempos: string[]; // Logs de consumo de tempo por lance
    analise: string[];         // Espaço reservado para avaliações de engine
    data: Date;
    status: 'em_andamento' | 'brancas_vencem' | 'pretas_vencem' | 'empate';
    jogadorBrancas: string; 
    jogadorPretas: string;
    tempoId: string | null;
    // Adiciona o tipo local para identificar partidas jogadas no mesmo dispositivo físico
    tipoPartida: 'bot' | 'multiplayer' | 'local';
}

/**
 * Esquema de definição para persistência de partidas.
 */
const MatchSchema = new Schema<IMatch>({
    pgn: { type: [String], default: [] },
    fenHistory: { type: [String], default: [] }, // NOVO: Persistência do histórico de posições
    historicoTempos: { type: [String], default: [] },
    analise: { type: [String], default: [] },
    data: { type: Date, default: Date.now },
    status: { 
        type: String, 
        enum: ['em_andamento', 'brancas_vencem', 'pretas_vencem', 'empate'], 
        default: 'em_andamento' 
    },
    jogadorBrancas: { type: String, required: true },
    jogadorPretas: { type: String, required: true },
    tempoId: { type: String, default: null },
    // Expande as opções permitidas no banco de dados para aceitar a flag 'local'
    tipoPartida: { 
        type: String, 
        enum: ['bot', 'multiplayer', 'local'], 
        required: true
    }
});

export const MatchModel = model<IMatch>('Match', MatchSchema);
