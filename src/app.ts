import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// --- DAOs ---
import { ProfileDAO } from './modules/profile/ProfileDAO';
import { BotDAO } from './modules/bot/BotDAO';
import { TimeDAO } from './modules/time/TimeDAO';
import { MatchDAO } from './modules/match/MatchDAO';

// --- Services ---
import { ProfileService } from './modules/profile/ProfileService';
import { BotService } from './modules/bot/BotService';
import { TimeService } from './modules/time/TimeService';
import { MatchService } from './modules/match/MatchService';

// --- Controllers ---
import { ProfileController } from './modules/profile/ProfileController';
import { BotController } from './modules/bot/BotController';
import { TimeController } from './modules/time/TimeController';
import { MatchController } from './modules/match/MatchController';
import { ClockController } from './modules/clock/ClockController';

// --- Arquivos de Rotas Isolados ---
import { authRoutes } from './routes/auth.routes';
import { botRoutes } from './routes/bot.routes';
import { timeRoutes } from './routes/time.routes';
import { matchRoutes } from './routes/match.routes';
import { clockRoutes } from './routes/clock.routes'; 
import { profileRoutes } from './routes/profile.routes'; // <--- NOVO: Importação das rotas de perfil

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 1. INJEÇÃO DE DEPENDÊNCIAS
// ==========================================

// Perfil
const profileDAO = new ProfileDAO();
const profileService = new ProfileService(profileDAO);
const profileController = new ProfileController(profileService);

// Bots
const botDAO = new BotDAO();
const botService = new BotService(botDAO);
const botController = new BotController(botService);

// Tempos
const timeDAO = new TimeDAO();
const timeService = new TimeService(timeDAO);
const timeController = new TimeController(timeService);

// Partidas (Match)
const matchDAO = new MatchDAO();
const matchService = new MatchService(timeService, profileService, matchDAO);
const matchController = new MatchController(matchService);

// Relógio (Clock) - Sincronizador de Tempo
// Passamos o matchService para ele conseguir buscar a partida na RAM!
const clockController = new ClockController(matchService);

// ==========================================
// 2. CONFIGURAÇÃO DE ROTAS
// ==========================================

app.use('/', authRoutes(profileController));
app.use('/', botRoutes(botController));
app.use('/', timeRoutes(timeController));
app.use('/', matchRoutes(matchController));
app.use('/', clockRoutes(clockController));

// NOVO: Adicionamos o prefixo '/perfil' para que tudo dentro do profileRoutes 
// responda corretamente (ex: PUT /perfil/:username)
app.use('/perfil', profileRoutes(profileController)); 

// ==========================================
// 3. START SERVER & BANCO
// ==========================================

const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI!)
    .then(() => {
        console.log('✅ Conectado ao MongoDB Atlas');
        app.listen(PORT, () => {
            console.log(`🚀 Servidor rodando na porta ${PORT}`);
        });
    })
    .catch((error) => console.error('❌ Erro no MongoDB:', error));

export default app;
