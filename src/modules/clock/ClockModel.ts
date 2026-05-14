export interface RelogioEstado {
    brancasRestante: number; 
    pretasRestante: number;  
    incremento: number;      
    ativo: boolean;          
    turnoAtual: 'branca' | 'preta';
    ultimoTimestamp: number | null; 
}

export interface ResultadoTempo {
    brancas: number;
    pretas: number;
    fimNoTempo: boolean;
    vencedorPorTempo: 'branca' | 'preta' | null;
}
