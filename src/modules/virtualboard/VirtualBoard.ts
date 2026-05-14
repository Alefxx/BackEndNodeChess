export type Cor = 'branca' | 'preta';
export type TipoPeca = 'peao' | 'torre' | 'cavalo' | 'bispo' | 'rainha' | 'rei';
export type Posicao = string;

export interface Peca {
    tipo: TipoPeca;
    cor: Cor;
    codigoFen?: string; 
}

export interface ResultadoMovimento {
    sucesso: boolean;
    promocaoPendente?: Posicao; 
    isXeque?: boolean;        
    corAdversaria?: Cor;      
    isEmpateRepeticao?: boolean; 
}

/**
 * Modelo de Entidade representando o estado físico do tabuleiro de xadrez.
 * Atua exclusivamente como estrutura de dados em memória.
 */
export class VirtualBoard {
    
    // Mapeamento ativo das posições para as peças correspondentes
    public estado: Map<Posicao, Peca>;
    
    // Indica a casa vulnerável a uma captura "En Passant" durante o turno corrente
    public alvoEnPassant: Posicao | null = null;
    
    // Rastreamento dos direitos remanescentes de Roque para ambos os jogadores
    public direitosRoque = {
        branca: { roquePequeno: true, roqueGrande: true },
        preta: { roquePequeno: true, roqueGrande: true }
    };
    
    // Histórico de hashes de posição utilizado para validação de empate por tripla repetição
    public historicoPosicoes = new Map<string, number>();

    /**
     * @param estadoInicial - Mapeamento pré-configurado de peças. Inicializa vazio se omitido.
     */
    constructor(estadoInicial?: Map<Posicao, Peca>) {
        this.estado = estadoInicial ? new Map(estadoInicial) : new Map();
    }


    // MÉTODOS DE ENCAPSULAMENTO DE ESTADO

    
    public getPecaNaCasa(posicao: Posicao): Peca | undefined { 
        return this.estado.get(posicao); 
    }
    
    public setPeca(posicao: Posicao, peca: Peca): void { 
        this.estado.set(posicao, peca); 
    }
    
    public removerPeca(posicao: Posicao): void { 
        this.estado.delete(posicao); 
    }
    
    public obterSnapshot(): Map<Posicao, Peca> { 
        return new Map(this.estado); 
    }


    // SERIALIZAÇÃO DE DADOS


    /**
     * Transcreve o estado em memória para uma string na notação universal FEN (Forsyth-Edwards Notation).
     * 
     * @param turno - Caractere identificador de qual cor deve jogar o próximo lance ('w' ou 'b').
     * @returns String formatada segundo o padrão FEN.
     */
    public gerarFEN(turno: 'w' | 'b' = 'w'): string {
        let fen = "";
        const colunas = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

        // Varredura de construção FEN processa da 8ª fileira até a 1ª
        for (let linha = 8; linha >= 1; linha--) {
            let vazias = 0;
            
            // Varredura sequencial das colunas de 'a' até 'h'
            for (let col = 0; col < 8; col++) {
                const posicao = `${colunas[col]}${linha}`;
                const peca = this.estado.get(posicao);

                if (!peca) {
                    vazias++;
                } else {
                    // Adiciona as casas vazias acumuladas antes da peça atual
                    if (vazias > 0) {
                        fen += vazias;
                        vazias = 0;
                    }
                    
                    // Transcodificação do tipo da peça para a letra normativa do idioma inglês
                    let letra = peca.tipo === 'cavalo' ? 'n' : peca.tipo.charAt(0);
                    if (peca.tipo === 'rei') letra = 'k';
                    if (peca.tipo === 'rainha') letra = 'q';
                    if (peca.tipo === 'bispo') letra = 'b';
                    if (peca.tipo === 'torre') letra = 'r';

                    // Aplicação de case sensível: Maiúsculas para Brancas, Minúsculas para Pretas
                    fen += peca.cor === 'branca' ? letra.toUpperCase() : letra.toLowerCase();
                }
            }
            
            // Finaliza fileiras que terminam com sequência de casas vazias
            if (vazias > 0) fen += vazias;
            
            // Insere o delimitador de fileira, exceto após a fileira 1
            if (linha > 1) fen += "/"; 
        }

        // TODO: Implementar substituição dinâmica de KQkq e en-passant lendo 
        // os atributos this.direitosRoque e this.alvoEnPassant da instância.
        fen += ` ${turno} KQkq - 0 1`; 
        
        return fen;
    }
}
