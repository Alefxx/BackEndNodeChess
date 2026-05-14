import { Schema, model, Document } from 'mongoose';

/**
 * Interface representativa de um perfil de usuário no ecossistema.
 * Define o contrato para tipagem estrita e segurança em tempo de compilação.
 */
export interface IProfile extends Document {
    nome: string;
    foto: string;
    rating: number;
    username: string;
    senha: string;
}

/**
 * Esquema de definição para persistência no MongoDB via Mongoose.
 */
const ProfileSchema = new Schema<IProfile>({
    nome: { type: String, required: true },
    foto: { type: String, default: "/img/img_padrao.jpg" },
    rating: { type: Number, default: 1200 }, // Rating inicial padrão para novos jogadores
    username: { type: String, required: true, unique: true }, // Garantia de unicidade em nível de banco
    senha: { type: String, required: true }
});

export const ProfileModel = model<IProfile>('Profile', ProfileSchema);
