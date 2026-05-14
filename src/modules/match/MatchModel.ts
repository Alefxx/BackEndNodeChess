import { Schema, model, Document } from 'mongoose';

/**
 * Interface representativa do documento Match no MongoDB.
 */
export interface IMatch extends Document {
    pgn: string[];            // Histórico de lances em notação algébrica
    historicoTempos: string[]; // Logs de consumo de tempo por lance
    analise: string[];         // Espaço reservado para avaliações de engine
    data: Date;
    status: 'em_andamento' | 'brancas_vencem' | 'pretas_vencem' | 'empate';
    jogadorBrancas: string; 
    jogadorPretas: string;
    tempoId: string | null;
    tipoPartida: 'bot' | 'multiplayer';
}

/**
 * Esquema de definição para persistência de partidas.
 */
const MatchSchema = new Schema<IMatch>({
    pgn: { type: [String], default: [] },
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
    tipoPartida: { 
        type: String, 
        enum: ['bot', 'multiplayer'], 
        required: true
    }
});

export const MatchModel = model<IMatch>('Match', MatchSchema);
