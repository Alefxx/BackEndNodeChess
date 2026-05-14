import { Posicao, TipoPeca, ResultadoMovimento, Peca, VirtualBoard } from './VirtualBoard';
import { BoardController } from '../board/BoardController';
import { VirtualBoardService } from './VirtualBoardService';

/**
 * Controlador de fachada (Facade) para o Tabuleiro Virtual.
 * Encapsula a lógica de inicialização e atua como intermediário entre
 * as requisições externas e o serviço de domínio do tabuleiro.
 */
export class VirtualBoardController {
    
    // Referência ao serviço que contém a lógica de negócios e físicas do jogo
    private boardService: VirtualBoardService;

    /**
     * Inicializa o tabuleiro virtual e seu serviço de domínio.
     * 
     * @param estadoInicial - Mapa opcional contendo uma disposição pré-existente das peças (ex: carregamento de save). 
     * Caso omitido, o estado padrão inicial do xadrez será adotado.
     */
    constructor(estadoInicial?: Map<Posicao, Peca>) {
        const estado = estadoInicial || BoardController.gerarEstadoInicialParaVirtualBoard();
        
        // Instancia a entidade de dados de estado do tabuleiro
        const tabuleiroVisual = new VirtualBoard(estado);
        
        // Injeta a entidade no serviço para processamento de regras
        this.boardService = new VirtualBoardService(tabuleiroVisual);
    }

    /**
     * Recupera uma cópia imutável do estado atual do tabuleiro.
     * Utilizado para a renderização da interface gráfica.
     */
    public obterEstadoParaFrontEnd(): Map<Posicao, Peca> {
        return this.boardService.tabuleiro.obterSnapshot();
    }

    /**
     * Solicita a execução de um movimento físico no tabuleiro.
     * 
     * @param origem - Coordenada inicial da peça.
     * @param destino - Coordenada alvo do movimento.
     * @returns Objeto detalhando o sucesso da operação e consequências (ex: xeque).
     */
    public efetivarMovimento(origem: Posicao, destino: Posicao): ResultadoMovimento {
        return this.boardService.mover(origem, destino);
    }

    /**
     * Executa a alteração do tipo de uma peça, geralmente aplicada na promoção de peões.
     * 
     * @param posicao - Coordenada da peça a ser promovida.
     * @param novoTipo - O tipo de peça resultante da promoção.
     */
    public efetivarPromocao(posicao: Posicao, novoTipo: TipoPeca): void {
        this.boardService.promoverPeca(posicao, novoTipo);
    }

    /**
     * Consulta os dados de uma peça localizada em uma coordenada específica.
     */
    public consultarPeca(posicao: Posicao): Peca | undefined {
        return this.boardService.tabuleiro.getPecaNaCasa(posicao);
    }

    /**
     * Analisa se o Rei da cor especificada está sob ameaça de captura (Xeque).
     */
    public consultarStatusXeque(corDoRei: 'branca' | 'preta'): boolean {
        return this.boardService.verificarReiEmXeque(corDoRei);
    }
}
