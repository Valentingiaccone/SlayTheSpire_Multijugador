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
    obtenerCartaMejorada,
    obtenerDataCarta,
    obtenerEncantamientoCarta,
    puedeEncantarseCarta,
    puedeMejorarseCarta
} from "../../compartido/Cartas";
import {
    CATALOGO_ENCANTAMIENTOS,
    EncantamientoId
} from "../../compartido/CondicionesYEfectos";
import { CardView } from "./CardView";

const { ccclass, property } = _decorator;

export type ModoVisorMazo =
    | "CONSULTA"
    | "FORJA"
    | "ELIMINAR"
    | "ENCANTAR"
    | "ELIMINAR_MULTI"
    | "PILA_ROBO"
    | "PILA_DESCARTE"
    | "PILA_AGOTADAS";

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

    public esModoAccionReliquia(): boolean {
        return this.modoActual === "ENCANTAR" || this.modoActual === "ELIMINAR_MULTI";
    }

    public abrirModoConsulta(): void {
        this.configurarYAbrir("CONSULTA", null, null);
    }

    public abrirModoPilaCombate(tipoPila: "ROBO" | "DESCARTE" | "AGOTADAS"): void {
        const modo: ModoVisorMazo =
            tipoPila === "ROBO"
                ? "PILA_ROBO"
                : tipoPila === "DESCARTE"
                ? "PILA_DESCARTE"
                : "PILA_AGOTADAS";
        this.configurarYAbrir(modo, null, null);
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

    public abrirModoEncantarReliquia(): void {
        this.configurarYAbrir("ENCANTAR", null, null);
    }

    public abrirModoEliminarMultipleReliquia(): void {
        this.configurarYAbrir("ELIMINAR_MULTI", null, null);
    }

    public cerrarVisor(): void {
        if (this.panelPrevisualizacion) this.panelPrevisualizacion.active = false;
        this.entradaSeleccionada = null;
        this.modoActual = "CONSULTA";
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
        if (this.btnCerrar) {
            this.btnCerrar.active = modo !== "ENCANTAR";
        }

        const state = NetworkManager.instance?.room?.state;
        if (state) {
            this.renderizarMazo(state);
        }

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

        if (this.btnCerrar) {
            this.btnCerrar.active = this.modoActual !== "ENCANTAR";
        }

        this.entradasMostradas = [];

        if (this.modoActual === "PILA_ROBO") {
            const copiaRobo = Array.from(miJugador.pilaRobo || []);
            copiaRobo.sort((a, b) => {
                const nomA = obtenerDataCarta(a)?.nombre || a;
                const nomB = obtenerDataCarta(b)?.nombre || b;
                return nomA.localeCompare(nomB);
            });
            copiaRobo.forEach((cartaId, idx) => {
                this.entradasMostradas.push({ indiceRealEnMazo: idx, cartaId });
            });
        } else if (this.modoActual === "PILA_DESCARTE") {
            Array.from(miJugador.descarte || []).forEach((cartaId, idx) => {
                this.entradasMostradas.push({ indiceRealEnMazo: idx, cartaId });
            });
        } else if (this.modoActual === "PILA_AGOTADAS") {
            Array.from(miJugador.agotadas || []).forEach((cartaId, idx) => {
                this.entradasMostradas.push({ indiceRealEnMazo: idx, cartaId });
            });
        } else {
            const mazoCompleto: string[] = Array.from(miJugador.mazoMaestro || []);
            mazoCompleto.forEach((cartaId, indiceReal) => {
                if (this.modoActual === "FORJA") {
                    if (puedeMejorarseCarta(cartaId)) {
                        this.entradasMostradas.push({ indiceRealEnMazo: indiceReal, cartaId });
                    }
                } else if (this.modoActual === "ENCANTAR") {
                    if (puedeEncantarseCarta(cartaId)) {
                        this.entradasMostradas.push({ indiceRealEnMazo: indiceReal, cartaId });
                    }
                } else {
                    this.entradasMostradas.push({ indiceRealEnMazo: indiceReal, cartaId });
                }
            });
        }

        if (this.labelTitulo) {
            switch (this.modoActual) {
                case "CONSULTA":
                    this.labelTitulo.string = `📚 Tu Mazo Total (${this.entradasMostradas.length} cartas)`;
                    break;
                case "PILA_ROBO":
                    this.labelTitulo.string = `🎴 Pila de Robo — Cartas por salir (${this.entradasMostradas.length})`;
                    break;
                case "PILA_DESCARTE":
                    this.labelTitulo.string = `♻️ Pila de Descarte (${this.entradasMostradas.length})`;
                    break;
                case "PILA_AGOTADAS":
                    this.labelTitulo.string = `🔥 Cartas Agotadas en este combate (${this.entradasMostradas.length})`;
                    break;
                case "FORJA":
                    this.labelTitulo.string =
                        this.entradasMostradas.length > 0
                            ? `🔨 Seleccioná una carta para mejorar (${this.entradasMostradas.length} disponibles)`
                            : "⚠️ No tenés cartas mejorables en tu mazo";
                    break;
                case "ELIMINAR":
                    this.labelTitulo.string = `🗑️ Seleccioná una carta para eliminar de tu mazo (${this.entradasMostradas.length} cartas)`;
                    break;
                case "ENCANTAR": {
                    const encId = (miJugador.accionReliquiaPendienteParam || "GRATIS") as EncantamientoId;
                    const nomEnc = CATALOGO_ENCANTAMIENTOS[encId]?.nombre || encId;
                    this.labelTitulo.string = `✨ Pasaporte — Elegí una carta para encantar con "${nomEnc}" (${this.entradasMostradas.length} disponibles)`;
                    break;
                }
                case "ELIMINAR_MULTI":
                    this.labelTitulo.string = `🗑️ Tacho de basura — Podés eliminar hasta ${miJugador.accionReliquiaPendienteRestantes} carta(s) más (Cerrá para terminar)`;
                    break;
            }
        }

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
            const data = obtenerDataCarta(entrada.cartaId);
            if (!data) {
                nodo.active = false;
                return;
            }

            nodo.active = true;
            const fila = Math.floor(i / this.COLUMNAS);
            const col = i % this.COLUMNAS;
            const colCentrada = col - (this.COLUMNAS - 1) / 2;

            const x = colCentrada * this.ESPACIO_X;
            const y = -(this.MARGEN_SUPERIOR + fila * this.ESPACIO_Y);
            nodo.setPosition(x, y, 0);

            const enc = obtenerEncantamientoCarta(entrada.cartaId);
            const cardView = nodo.getComponent(CardView);
            cardView?.configurarModoEstatico(data, 0.88, enc);
        });
    }

    private onClickCartaEnGrilla(indiceSlot: number) {
        if (
            this.modoActual !== "FORJA" &&
            this.modoActual !== "ELIMINAR" &&
            this.modoActual !== "ENCANTAR" &&
            this.modoActual !== "ELIMINAR_MULTI"
        ) {
            return;
        }

        const entrada = this.entradasMostradas[indiceSlot];
        if (!entrada) return;

        const dataActual = obtenerDataCarta(entrada.cartaId);
        if (!dataActual) return;

        const encActual = obtenerEncantamientoCarta(entrada.cartaId);
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
                    this.cartaPreviewIzquierda.configurarModoEstatico(dataActual, 1, encActual);
                }
                if (this.nodoFlechaMejora) {
                    this.nodoFlechaMejora.active = true;
                }
                if (this.cartaPreviewDerecha) {
                    this.cartaPreviewDerecha.node.active = true;
                    this.cartaPreviewDerecha.configurarModoEstatico(dataMejorada, 1.05, encActual);
                }
                if (this.labelBtnConfirmar) {
                    this.labelBtnConfirmar.string = "Continuar (Forjar)";
                }
            } else {
                this.onClickConfirmarPrevisualizacion();
            }
        } else if (this.modoActual === "ENCANTAR") {
            const state = NetworkManager.instance?.room?.state;
            const miId = NetworkManager.instance?.room?.sessionId;
            const miJugador = miId && state ? state.jugadores.get(miId) : undefined;
            const encDestino = (miJugador?.accionReliquiaPendienteParam || "GRATIS") as EncantamientoId;
            const nomEnc = CATALOGO_ENCANTAMIENTOS[encDestino]?.nombre || encDestino;

            if (this.panelPrevisualizacion) {
                this.panelPrevisualizacion.active = true;
                if (this.labelTituloPrevisualizacion) {
                    this.labelTituloPrevisualizacion.string = `✨ ¿Encantar ${dataActual.nombre} con "${nomEnc}"?`;
                }
                if (this.cartaPreviewIzquierda) {
                    this.cartaPreviewIzquierda.node.active = true;
                    this.cartaPreviewIzquierda.configurarModoEstatico(dataActual, 1, encActual);
                }
                if (this.nodoFlechaMejora) {
                    this.nodoFlechaMejora.active = true;
                }
                if (this.cartaPreviewDerecha) {
                    this.cartaPreviewDerecha.node.active = true;
                    this.cartaPreviewDerecha.configurarModoEstatico(dataActual, 1.05, encDestino);
                }
                if (this.labelBtnConfirmar) {
                    this.labelBtnConfirmar.string = "Confirmar Encantamiento";
                }
            } else {
                this.onClickConfirmarPrevisualizacion();
            }
        } else if (this.modoActual === "ELIMINAR" || this.modoActual === "ELIMINAR_MULTI") {
            if (this.panelPrevisualizacion) {
                this.panelPrevisualizacion.active = true;
                if (this.labelTituloPrevisualizacion) {
                    this.labelTituloPrevisualizacion.string = `🗑️ ¿Eliminar ${dataActual.nombre} de tu mazo?`;
                }
                if (this.cartaPreviewIzquierda) {
                    this.cartaPreviewIzquierda.node.active = true;
                    this.cartaPreviewIzquierda.configurarModoEstatico(dataActual, 1, encActual);
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

    public onClickConfirmarPrevisualizacion() {
        if (!this.entradaSeleccionada) return;
        const { indiceRealEnMazo, cartaId } = this.entradaSeleccionada;

        if (this.modoActual === "ENCANTAR" || this.modoActual === "ELIMINAR_MULTI") {
            this.entradaSeleccionada = null;
            if (this.panelPrevisualizacion) {
                this.panelPrevisualizacion.active = false;
            }
            NetworkManager.instance?.resolverAccionReliquia(indiceRealEnMazo, false);
            return;
        }

        const callback = this.alConfirmarCartaCallback;
        this.cerrarVisor();
        callback?.(indiceRealEnMazo, cartaId);
    }

    public onClickCancelarPrevisualizacion() {
        this.entradaSeleccionada = null;
        if (this.panelPrevisualizacion) {
            this.panelPrevisualizacion.active = false;
        }
    }

    public onClickCerrarVisor() {
        if (this.modoActual === "ENCANTAR") return;

        if (this.modoActual === "ELIMINAR_MULTI") {
            NetworkManager.instance?.resolverAccionReliquia(undefined, true);
            this.cerrarVisor();
            return;
        }

        const callbackCancelar = this.alCancelarCallback;
        this.cerrarVisor();
        callbackCancelar?.();
    }
}