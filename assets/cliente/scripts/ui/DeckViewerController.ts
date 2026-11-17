import {
    _decorator,
    Component,
    Node,
    Label,
    Button,
    ScrollView,
    Prefab,
    instantiate,
    UITransform
} from "cc";
import { NetworkManager, NetworkEvents, EVENTO_ESTADO_ACTUALIZADO } from "../network/NetworkManager";
import { IEstadoSalaCliente } from "../../compartido/GameTypes";
import {
    CATALOGO_CARTAS,
    obtenerCartaMejorada,
    puedeMejorarseCarta
} from "../../compartido/Cartas";
import { CardView } from "./CardView";

const { ccclass, property } = _decorator;

export type ModoVisorMazo = "CONSULTA" | "FORJA" | "ELIMINAR";

interface IEntradaMazoFiltrada {
    indiceRealEnMazo: number;
    cartaId: string;
}

@ccclass("DeckViewerController")
export class DeckViewerController extends Component {
    @property(Label) labelTitulo: Label = null!;
    @property(ScrollView) scrollViewMazo: ScrollView = null!;
    @property(Node) contentScroll: Node = null!;
    @property(Node) contenedorCartas: Node = null!;
    @property(Prefab) prefabCarta: Prefab = null!;
    @property(Node) btnCerrar: Node = null!;

    // Subpanel de previsualización (usado en FORJA para mostrar [Carta Actual] -> [Carta Mejorada+] y en ELIMINAR)
    @property(Node) panelPrevisualizacion: Node = null!;
    @property(Label) labelTituloPrevisualizacion: Label = null!;
    @property(CardView) cartaPreviewIzquierda: CardView = null!;
    @property(Node) nodoFlechaMejora: Node = null!;
    @property(CardView) cartaPreviewDerecha: CardView = null!;
    @property(Button) btnConfirmarPrevisualizacion: Button = null!;
    @property(Label) labelBtnConfirmar: Label = null!;

    private readonly COLUMNAS = 4;
    private readonly ESPACIO_X = 185;
    private readonly ESPACIO_Y = 250;
    private readonly MARGEN_SUPERIOR = 140;

    private modoActual: ModoVisorMazo = "CONSULTA";
    private nodosInstanciados: Node[] = [];
    private entradasMostradas: IEntradaMazoFiltrada[] = [];
    private entradaSeleccionada: IEntradaMazoFiltrada | null = null;

    private alConfirmarCartaCallback: ((indiceMazo: number, cartaId: string) => void) | null = null;
    private alCancelarCallback: (() => void) | null = null;

    onEnable() {
        NetworkEvents.on(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoCambiado, this);
    }

    onDisable() {
        NetworkEvents.off(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoCambiado, this);
    }

    public abrirModoConsulta(): void {
        this.configurarYAbrir("CONSULTA", null, null);
    }

    public abrirModoForja(
        alConfirmarMejora: (indiceMazo: number, cartaId: string) => void,
        alVolver: () => void
    ): void {
        this.configurarYAbrir("FORJA", alConfirmarMejora, alVolver);
    }

    public abrirModoEliminar(
        alConfirmarEliminar: (indiceMazo: number, cartaId: string) => void,
        alVolver: () => void
    ): void {
        this.configurarYAbrir("ELIMINAR", alConfirmarEliminar, alVolver);
    }

    public cerrarVisor(): void {
        if (this.panelPrevisualizacion) this.panelPrevisualizacion.active = false;
        this.entradaSeleccionada = null;
        this.node.active = false;
    }

    private configurarYAbrir(
        modo: ModoVisorMazo,
        onConfirmar: ((indiceMazo: number, cartaId: string) => void) | null,
        onCancelar: (() => void) | null
    ): void {
        this.modoActual = modo;
        this.alConfirmarCartaCallback = onConfirmar;
        this.alCancelarCallback = onCancelar;
        this.entradaSeleccionada = null;

        this.node.active = true;
        if (this.panelPrevisualizacion) {
            this.panelPrevisualizacion.active = false;
        }

        const state = NetworkManager.instance?.room?.state;
        if (state) {
            this.renderizarMazo(state);
        }

        // Iniciar la cámara siempre arriba del todo para deslizar hacia abajo
        this.scheduleOnce(() => {
            this.scrollViewMazo?.scrollToTop(0.05);
        }, 0);
    }

    private onEstadoCambiado(state: IEstadoSalaCliente) {
        if (!this.node.active) return;
        this.renderizarMazo(state);
    }

    private renderizarMazo(state: IEstadoSalaCliente) {
        const miId = NetworkManager.instance?.room?.sessionId;
        const miJugador = miId ? state.jugadores.get(miId) : undefined;
        if (!miJugador || !this.contenedorCartas || !this.prefabCarta) return;

        const mazoCompleto: string[] = Array.from(miJugador.mazoMaestro || []);
        this.entradasMostradas = [];

        mazoCompleto.forEach((cartaId, indiceReal) => {
            if (this.modoActual === "FORJA") {
                if (puedeMejorarseCarta(cartaId)) {
                    this.entradasMostradas.push({ indiceRealEnMazo: indiceReal, cartaId });
                }
            } else {
                this.entradasMostradas.push({ indiceRealEnMazo: indiceReal, cartaId });
            }
        });

        if (this.labelTitulo) {
            if (this.modoActual === "CONSULTA") {
                this.labelTitulo.string = `📚 Tu Mazo Total (${this.entradasMostradas.length} cartas)`;
            } else if (this.modoActual === "FORJA") {
                this.labelTitulo.string =
                    this.entradasMostradas.length > 0
                        ? `🔨 Seleccioná una carta para mejorar (${this.entradasMostradas.length} disponibles)`
                        : "⚠️ No tenés cartas mejorables en tu mazo";
            } else {
                this.labelTitulo.string = `🗑️ Seleccioná una carta para eliminar de tu mazo (${this.entradasMostradas.length} cartas)`;
            }
        }

        // Calcular alto del Content para ScrollView con inicio arriba (Anchor Y = 1 recomendado en Content)
        const totalFilas = Math.max(1, Math.ceil(this.entradasMostradas.length / this.COLUMNAS));
        const altoNecesario = totalFilas * this.ESPACIO_Y + this.MARGEN_SUPERIOR * 2;
        const uiContent = this.contentScroll?.getComponent(UITransform);
        if (uiContent) {
            uiContent.setContentSize(uiContent.width, Math.max(600, altoNecesario));
        }

        while (this.nodosInstanciados.length < this.entradasMostradas.length) {
            const idxSlot = this.nodosInstanciados.length;
            const nodo = instantiate(this.prefabCarta);
            this.contenedorCartas.addChild(nodo);
            if (!nodo.getComponent(Button)) {
                nodo.addComponent(Button);
            }
            nodo.on(
                Button.EventType.CLICK,
                () => this.onClickCartaEnGrilla(idxSlot),
                this
            );
            this.nodosInstanciados.push(nodo);
        }

        this.nodosInstanciados.forEach((nodo, i) => {
            if (i >= this.entradasMostradas.length) {
                nodo.active = false;
                return;
            }

            const entrada = this.entradasMostradas[i];
            const data = CATALOGO_CARTAS[entrada.cartaId];
            if (!data) {
                nodo.active = false;
                return;
            }

            nodo.active = true;
            const fila = Math.floor(i / this.COLUMNAS);
            const col = i % this.COLUMNAS;
            const colCentrada = col - (this.COLUMNAS - 1) / 2;

            // Posicionamos de arriba hacia abajo (Y negativo desde el borde superior del content)
            const x = colCentrada * this.ESPACIO_X;
            const y = -(this.MARGEN_SUPERIOR + fila * this.ESPACIO_Y);
            nodo.setPosition(x, y, 0);

            const cardView = nodo.getComponent(CardView);
            cardView?.configurarModoEstatico(data, 0.88);
        });
    }

    private onClickCartaEnGrilla(indiceSlot: number) {
        if (this.modoActual === "CONSULTA") return;

        const entrada = this.entradasMostradas[indiceSlot];
        if (!entrada) return;

        const dataActual = CATALOGO_CARTAS[entrada.cartaId];
        if (!dataActual) return;

        this.entradaSeleccionada = entrada;

        if (this.modoActual === "FORJA") {
            const dataMejorada = obtenerCartaMejorada(entrada.cartaId);
            if (!dataMejorada) return;

            if (this.panelPrevisualizacion) {
                this.panelPrevisualizacion.active = true;
                if (this.labelTituloPrevisualizacion) {
                    this.labelTituloPrevisualizacion.string = `🔨 ¿Mejorar ${dataActual.nombre} a ${dataMejorada.nombre}?`;
                }
                if (this.cartaPreviewIzquierda) {
                    this.cartaPreviewIzquierda.node.active = true;
                    this.cartaPreviewIzquierda.configurarModoEstatico(dataActual, 1);
                }
                if (this.nodoFlechaMejora) {
                    this.nodoFlechaMejora.active = true;
                }
                if (this.cartaPreviewDerecha) {
                    this.cartaPreviewDerecha.node.active = true;
                    this.cartaPreviewDerecha.configurarModoEstatico(dataMejorada, 1.05);
                }
                if (this.labelBtnConfirmar) {
                    this.labelBtnConfirmar.string = "Continuar (Forjar)";
                }
            } else {
                this.onClickConfirmarPrevisualizacion();
            }
        } else if (this.modoActual === "ELIMINAR") {
            if (this.panelPrevisualizacion) {
                this.panelPrevisualizacion.active = true;
                if (this.labelTituloPrevisualizacion) {
                    this.labelTituloPrevisualizacion.string = `🗑️ ¿Eliminar ${dataActual.nombre} de tu mazo?`;
                }
                if (this.cartaPreviewIzquierda) {
                    this.cartaPreviewIzquierda.node.active = true;
                    this.cartaPreviewIzquierda.configurarModoEstatico(dataActual, 1);
                }
                if (this.nodoFlechaMejora) {
                    this.nodoFlechaMejora.active = false;
                }
                if (this.cartaPreviewDerecha) {
                    this.cartaPreviewDerecha.node.active = false;
                }
                if (this.labelBtnConfirmar) {
                    this.labelBtnConfirmar.string = "Continuar (Eliminar)";
                }
            } else {
                this.onClickConfirmarPrevisualizacion();
            }
        }
    }

    // Asignar al botón "Continuar" del panelPrevisualizacion
    public onClickConfirmarPrevisualizacion() {
        if (!this.entradaSeleccionada) return;
        const { indiceRealEnMazo, cartaId } = this.entradaSeleccionada;
        const callback = this.alConfirmarCartaCallback;
        this.cerrarVisor();
        callback?.(indiceRealEnMazo, cartaId);
    }

    // Asignar al botón "Cancelar / Elegir otra" del panelPrevisualizacion
    public onClickCancelarPrevisualizacion() {
        this.entradaSeleccionada = null;
        if (this.panelPrevisualizacion) {
            this.panelPrevisualizacion.active = false;
        }
    }

    // Asignar al botón "Cerrar / Volver" del visor principal
    public onClickCerrarVisor() {
        const callbackCancelar = this.alCancelarCallback;
        this.cerrarVisor();
        callbackCancelar?.();
    }
}