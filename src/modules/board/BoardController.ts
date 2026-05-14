import { DEFAULT_FEN } from './BoardModel';
import { Peca, Posicao } from '../virtualboard/VirtualBoard';

/**
 * Utilitário de gerenciamento de estado do tabuleiro.
 * Responsável pela conversão entre representações externas (FEN) e o modelo de domínio interno.
 */
export class BoardController {
    
    /**
     * Converte uma string na notação FEN (Forsyth-Edwards Notation) para um mapeamento de peças.
     * 
     * @param fenString String FEN opcional. Caso omitida, utiliza o estado inicial padrão.
     * @returns Um Map associando coordenadas (ex: 'e4') aos objetos Peca.
     */
    public static gerarEstadoInicialParaVirtualBoard(fenString: string = DEFAULT_FEN): Map<Posicao, Peca> {
        const estado = new Map<Posicao, Peca>();
        const colunas = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

        // Fallback de segurança para garantir a integridade da inicialização do motor
        const fenSeguro = fenString || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

        // Decomposição do FEN: O índice 0 contém a disposição física das peças
        const partesFen = fenSeguro.split(' ');
        const posicaoPecas = partesFen[0];

        if (!posicaoPecas) return estado;

        // O FEN organiza as fileiras separadas por barras, da 8ª para a 1ª
        const linhasFen = posicaoPecas.split('/');

        if (linhasFen.length !== 8) return estado; 

        for (let linhaIndex = 0; linhaIndex < 8; linhaIndex++) {
            const linhaAtual = linhasFen[linhaIndex];
            if (!linhaAtual) continue;

            let colIndex = 0; 

            for (let i = 0; i < linhaAtual.length; i++) {
                const char = linhaAtual.charAt(i);

                // Caracteres numéricos indicam a quantidade de casas vazias consecutivas
                if (!isNaN(parseInt(char, 10))) {
                    colIndex += parseInt(char, 10);
                } 
                // Letras representam peças específicas
                else {
                    // Conversão do índice de matriz (0-7) para a fileira real do xadrez (8-1)
                    const linhaXadrez = 8 - linhaIndex; 
                    const colunaXadrez = colunas[colIndex];
                    
                    if (!colunaXadrez) continue; 

                    const posicao: Posicao = `${colunaXadrez}${linhaXadrez}`;
                    
                    // Case-sensitivity define a cor: Maiúsculas = Brancas | Minúsculas = Pretas
                    const cor: 'branca' | 'preta' = (char === char.toUpperCase()) ? 'branca' : 'preta';
                    const lowerChar = char.toLowerCase();
                    
                    // Mapeamento léxico da notação FEN para o TipoPeca do sistema
                    let tipo: 'peao' | 'torre' | 'cavalo' | 'bispo' | 'rainha' | 'rei' = 'peao';
                    
                    switch (lowerChar) {
                        case 'r': tipo = 'torre'; break;
                        case 'n': tipo = 'cavalo'; break;
                        case 'b': tipo = 'bispo'; break;
                        case 'q': tipo = 'rainha'; break;
                        case 'k': tipo = 'rei'; break;
                        case 'p': default: tipo = 'peao';
                    }

                    // Persistência em memória RAM do estado do tabuleiro
                    estado.set(posicao, {
                        tipo: tipo,
                        cor: cor,
                        codigoFen: char
                    });
                    
                    colIndex++;
                }
            }
        }

        console.log(`[BOARD_CONTROLLER] Parsing concluído: ${estado.size} entidades instanciadas.`);
        return estado;
    }
}
