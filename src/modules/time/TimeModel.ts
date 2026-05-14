import { Schema, model, Document } from 'mongoose';

/**
 * Interface representativa do documento de configuração de tempo no MongoDB.
 */
export interface ITime extends Document {
    slug: string;       // Identificador único (ex: time_10_2)
    minutos: number;    // Tempo total inicial por jogador
    incremento: number; // Segundos adicionados após cada lance
    ativo: boolean;     // Controle de disponibilidade da opção
}

const TimeSchema = new Schema<ITime>({
    slug: { type: String, required: true, unique: true },
    minutos: { type: Number, required: true },
    incremento: { type: Number, required: true },
    ativo: { type: Boolean, default: true }
});

export const TimeModel = model<ITime>('Time', TimeSchema);

/**
 * Configuração mestre das regras de tempo disponíveis.
 * A chave representa os minutos e o array contém as opções de incremento em segundos.
 */
export const REGRAS_DE_TEMPO: Record<number, number[]> = {
    1: [1, 3, 5, 10],
    3: [3, 5, 10, 20],
    5: [5, 10, 20, 30],
    10: [10, 20, 30, 60],
    15: [20, 30, 60, 90],
    20: [30, 60, 90, 120],
    30: [60, 90, 120, 150],
    60: [90, 120, 150, 180],
    90: [120, 150, 180, 240]
};
