// A string universal FEN que representa o início de um jogo de xadrez
export const DEFAULT_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

// Dicionário mapeando os caracteres oficiais do FEN para o seu sistema
export const pecaMapaDict: Record<string, { tipo: any, cor: any }> = {
    'P': { tipo: 'peao', cor: 'branca' },
    'R': { tipo: 'torre', cor: 'branca' },
    'N': { tipo: 'cavalo', cor: 'branca' },
    'B': { tipo: 'bispo', cor: 'branca' },
    'Q': { tipo: 'rainha', cor: 'branca' },
    'K': { tipo: 'rei', cor: 'branca' },
    'p': { tipo: 'peao', cor: 'preta' },
    'r': { tipo: 'torre', cor: 'preta' },
    'n': { tipo: 'cavalo', cor: 'preta' },
    'b': { tipo: 'bispo', cor: 'preta' },
    'q': { tipo: 'rainha', cor: 'preta' },
    'k': { tipo: 'rei', cor: 'preta' }
};
