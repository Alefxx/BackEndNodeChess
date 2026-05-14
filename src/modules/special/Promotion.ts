import { VirtualBoard, Posicao, TipoPeca } from '../virtualboard/VirtualBoard';

/**
 * Utilitário responsável pelo processamento da promoção de peões.
 */
export class Promotion {
    /**
     * Converte um peão em uma peça de graduação superior baseada na escolha do usuário.
     * @param tabuleiro Instância do tabuleiro virtual.
     * @param posicao Coordenada onde a promoção ocorre.
     * @param escolhaDoFront Letra identificadora da peça (padrão FEN: q, r, b, n).
     */
    public static executar(tabuleiro: VirtualBoard, posicao: Posicao, escolhaDoFront: string): void {
        const pecaExistente = tabuleiro.getPecaNaCasa(posicao);
        
        // Validação de segurança para garantir que a peça alvo é de fato um peão
        if (pecaExistente && pecaExistente.tipo === 'peao') {
            let novoTipo: TipoPeca = 'rainha'; // Fallback para Rainha (promoção mais comum)
            
            // Mapeamento entre notação externa (FEN) e tipos internos do sistema
            switch (escolhaDoFront.toLowerCase()) {
                case 'r': novoTipo = 'torre'; break;
                case 'b': novoTipo = 'bispo'; break;
                case 'n': novoTipo = 'cavalo'; break;
                case 'q': novoTipo = 'rainha'; break;
            }

            // Atualização atômica da peça mantendo as propriedades de cor originais
            tabuleiro.setPeca(posicao, { ...pecaExistente, tipo: novoTipo });
        }
    }
}
