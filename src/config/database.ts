// src/config/database.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Carrega as variáveis do arquivo .env
dotenv.config();

const connectDB = async (): Promise<void> => {
    try {
        const uri = process.env.MONGO_URI;
        
        if (!uri) {
            throw new Error('A variável de ambiente MONGO_URI não está definida.');
        }

        // Conecta ao MongoDB
        await mongoose.connect(uri);
        console.log('✅ MongoDB conectado com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro ao conectar no MongoDB:', error);
        // Encerra o processo em caso de falha na conexão
        process.exit(1); 
    }
};

export default connectDB;

