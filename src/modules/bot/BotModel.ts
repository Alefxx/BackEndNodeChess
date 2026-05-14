import { Schema, model, Document } from 'mongoose';

/**
 * Interface representativa de um Bot (IA) no sistema.
 * Define os parâmetros que serão repassados ao motor Stockfish no Front-end.
 */
export interface IBot extends Document {
    nome: string;
    rating: number;
    foto: string;
    
    // Parâmetros técnicos para configuração da Engine
    skillLevel: number;        // Nível de habilidade UCI (0 a 20)
    depth: number;             // Profundidade de processamento (lances à frente)
    probabilidadeErro: number; // Margem de erro intencional (0.0 a 1.0)
}

/**
 * Esquema de persistência para os Bots.
 */
const BotSchema = new Schema<IBot>({
    nome: { type: String, required: true },
    rating: { type: Number, required: true },
    foto: { type: String, default: "/img/bot_padrao.png" },
    skillLevel: { type: Number, default: 0 },
    depth: { type: Number, default: 1 },
    probabilidadeErro: { type: Number, default: 0 }
});

export const BotModel = model<IBot>('Bot', BotSchema);
