import { _decorator, Component, Node, Label, Button, instantiate, Vec3, Prefab } from "cc";
import {
    NetworkManager,
    NetworkEvents,
    EVENTO_ESTADO_ACTUALIZADO,
    EVENTO_SECUENCIA_COMBATE
} from "../network/NetworkManager";
import {
    IEstadoSalaCliente,
    IJugadorCliente,
    IEnemigoCliente,
    IMapaEstadosCliente,
    EventoVisualCombate
} from "../../compartido/GameTypes";
import {
    esCartaGratisEsteTurno,
    obtenerDataCarta,
    obtenerEncantamientoCarta
} from "../../compartido/Cartas";
import { CalculadoraCombate } from "../../compartido/CalculadoraCombate";
import { NOMBRES_AMBIENTACION } from "../../compartido/Enemigos";
import { CardView } from "./CardView";
import { CombatEntityView } from "./CombatEntityView";
import { CombatSequencer } from "./CombatSequencer";
import { DeckViewerController } from "./DeckViewerController";
import { TooltipPopupView } from "./TooltipPopupView";

const { ccclass, property } = _decorator;

@ccclass("CombatController")
export class CombatController extends Component {
    @property(Label) labelTurno: Label = null!;

    @property(Node) contenedorEnemigos: Node = null!;
    @property(Node) templateEnemigo: Node = null!;

    @property(Node) contenedorAliados: Node = null!;
    @property(Node) templateAliado: Node = null!;

    @property(Node) contenedorMano: Node = null!;
    @property(Prefab) templateCarta: Prefab = null!;

    @property(Button) btnTerminarTurno: Button = null!;
    @property(Label) labelBtnTerminarTurno: Label = null!;

    @property(Node) btnPilaDescarte: Node = null!;
    @property(Label) labelCantDescarte: Label = null!;

    @property(Node) btnPilaRobo: Node = null!;
    @property(Label) labelCantRobo: Label = null!;

    @property(Node) btnPilaAgotadas: Node = null!;
    @property(Label) labelCantAgotadas: Label = null!;

    @property(DeckViewerController) visorMazo: DeckViewerController = null!;
    @property(TooltipPopupView) tooltipCombate: TooltipPopupView = null!;

    private vistasEnemigos: Map<string, CombatEntityView> = new Map();
    private vistasAliados: Map<string, CombatEntityView> = new Map();
    private datosEnemigosPorUid: Map<string, IEnemigoCliente> = new Map();
    private nodosCartas: Node[] = [];
    private secuenciador!: CombatSequencer;

    onLoad() {
        if (this.templateEnemigo) this.templateEnemigo.active = false;
        if (this.templateAliado) this.templateAliado.active = false;

        this.secuenciador = new CombatSequencer(
            (id) => this.vistasEnemigos.get(id) || this.vistasAliados.get(id),
            () => {
                const state = NetworkManager.instance?.room?.state;
                if (state) this.onEstadoCambiado(state);
            },
            // Callback para CARTA_DESCARTADA
            (cartaInstanciaId: string, destino: Vec3) => {
                const scriptCarta = this.obtenerCardViewDesdeMano(cartaInstanciaId);
                if (scriptCarta) scriptCarta.animarDescarte(destino);
            },
            // Callback para CARTA_AGOTADA
            (cartaInstanciaId: string, destino: Vec3) => {
                const scriptCarta = this.obtenerCardViewDesdeMano(cartaInstanciaId);
                if (scriptCarta) scriptCarta.animarAgotar(destino);
            }
        );
    }

    onEnable() {
        NetworkEvents.on(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoCambiado, this);
        NetworkEvents.on(EVENTO_SECUENCIA_COMBATE, this.onSecuenciaRecibida, this);
        if (NetworkManager.instance?.room?.state) {
            this.onEstadoCambiado(NetworkManager.instance.room.state);
        }
    }

    onDisable() {
        NetworkEvents.off(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoCambiado, this);
        NetworkEvents.off(EVENTO_SECUENCIA_COMBATE, this.onSecuenciaRecibida, this);
        this.secuenciador?.limpiar();
        this.tooltipCombate?.ocultar();
    }

    private onSecuenciaRecibida(eventos: EventoVisualCombate[]) {
        this.secuenciador.encolarLote(eventos);
    }

    private onEstadoCambiado(state: IEstadoSalaCliente) {
        if (state.faseActual !== "COMBAT" && state.faseActual !== "DEFEAT") return;

        if (this.labelTurno) {
            const mundoTxt = NOMBRES_AMBIENTACION[state.ambientacionActual] || "";
            this.labelTurno.string =
                state.faseActual === "DEFEAT"
                    ? "¡DERROTA! Todos cayeron"
                    : `Mapa ${state.mapaActual || 1}/3 (${mundoTxt})  —  Piso ${state.pisoActual}  —  Turno ${state.turnoNumero}`;
        }

        const miId = NetworkManager.instance?.room?.sessionId;
        const miJugador = miId ? state.jugadores.get(miId) : undefined;
        const animando = this.secuenciador.estaReproduciendo;

        this.renderizarEnemigos(state.enemigos, animando, miJugador?.estados);
        this.renderizarAliados(state.jugadores, animando);
    }

    private renderizarEnemigos(
        enemigos: IEstadoSalaCliente["enemigos"],
        bloquearHpYBloqueo: boolean,
        estadosMiJugador?: IMapaEstadosCliente
    ) {
        if (!this.contenedorEnemigos || !this.templateEnemigo) return;

        const idsPresentes = new Set<string>();
        this.datosEnemigosPorUid.clear();

        enemigos.forEach((enemigo: IEnemigoCliente) => {
            idsPresentes.add(enemigo.uid);
            this.datosEnemigosPorUid.set(enemigo.uid, enemigo);

            let vista = this.vistasEnemigos.get(enemigo.uid);

            if (!vista) {
                const nodo = instantiate(this.templateEnemigo);
                nodo.parent = this.contenedorEnemigos;
                vista = nodo.getComponent(CombatEntityView) || nodo.addComponent(CombatEntityView);
                this.vistasEnemigos.set(enemigo.uid, vista);
                vista.vincularTooltip((nodoOrigen, titulo, desc) =>
                    this.tooltipCombate?.mostrar(nodoOrigen, titulo, desc)
                );
                vista.sincronizarEnemigo(enemigo, false, estadosMiJugador);
            } else {
                vista.sincronizarEnemigo(enemigo, bloquearHpYBloqueo, estadosMiJugador);
            }
        });

        this.vistasEnemigos.forEach((vista, uid) => {
            if (!idsPresentes.has(uid)) {
                vista.node.active = false;
            }
        });
    }

    private renderizarAliados(
        jugadores: IEstadoSalaCliente["jugadores"],
        bloquearHpYBloqueo: boolean
    ) {
        if (!this.contenedorAliados || !this.templateAliado) return;

        const miId = NetworkManager.instance?.room?.sessionId;
        const idsPresentes = new Set<string>();
        let hayOtroAliadoVivo = false;

        jugadores.forEach((j: IJugadorCliente) => {
            if (j.sessionId !== miId && j.hp > 0) {
                hayOtroAliadoVivo = true;
            }
        });

        jugadores.forEach((j: IJugadorCliente) => {
            idsPresentes.add(j.sessionId);
            const esYo = j.sessionId === miId;
            let vista = this.vistasAliados.get(j.sessionId);

            if (!vista) {
                const nodo = instantiate(this.templateAliado);
                nodo.parent = this.contenedorAliados;
                vista = nodo.getComponent(CombatEntityView) || nodo.addComponent(CombatEntityView);
                this.vistasAliados.set(j.sessionId, vista);
                vista.vincularTooltip((nodoOrigen, titulo, desc) =>
                    this.tooltipCombate?.mostrar(nodoOrigen, titulo, desc)
                );
                vista.sincronizarAliado(j, esYo, false);
            } else {
                vista.sincronizarAliado(j, esYo, bloquearHpYBloqueo);
            }

            if (esYo) {
                if (this.btnTerminarTurno && this.labelBtnTerminarTurno) {
                    this.btnTerminarTurno.interactable = !j.turnoTerminado && j.hp > 0;
                    this.labelBtnTerminarTurno.string = j.turnoTerminado
                        ? "Esperando aliados..."
                        : "Terminar Turno";
                }
                this.actualizarBotonesPilas(j);
                this.renderizarMano(j, hayOtroAliadoVivo);
            }
        });

        this.vistasAliados.forEach((vista, sessionId) => {
            if (!idsPresentes.has(sessionId)) {
                vista.node.active = false;
            }
        });
    }

    private actualizarBotonesPilas(miJugador: IJugadorCliente) {
        if (this.labelCantDescarte) {
            this.labelCantDescarte.string = `${miJugador.cantDescarte || 0}`;
        }
        if (this.labelCantRobo) {
            this.labelCantRobo.string = `${miJugador.cantPilaRobo || 0}`;
        }

        const cantAgotadas = miJugador.cantAgotadas || 0;
        if (this.btnPilaAgotadas) {
            this.btnPilaAgotadas.active = cantAgotadas > 0;
        }
        if (this.labelCantAgotadas) {
            this.labelCantAgotadas.string = `${cantAgotadas}`;
        }
    }

    private renderizarMano(miJugador: IJugadorCliente, hayOtroAliadoVivo: boolean) {
        if (!this.contenedorMano || !this.templateCarta) return;

        while (this.nodosCartas.length < miJugador.mano.length) {
            const nodo = instantiate(this.templateCarta);
            this.contenedorMano.addChild(nodo);
            this.nodosCartas.push(nodo);
        }

        // Calcular total de ataques en mano y si todas las cartas son de ataque (para Clash y Golpe perfecto)
        let totalAtaquesEnMano = 0;
        let todasSonAtaque = miJugador.mano.length > 0;
        for (let i = 0; i < miJugador.mano.length; i++) {
            const c = obtenerDataCarta(miJugador.mano[i]);
            if (c?.tipo === "ATAQUE") {
                totalAtaquesEnMano++;
            } else {
                todasSonAtaque = false;
            }
        }

        this.nodosCartas.forEach((nodo, i) => {
            if (i >= miJugador.mano.length) {
                nodo.active = false;
                return;
            }

            const rawCartaId: string = miJugador.mano[i];
            const data = obtenerDataCarta(rawCartaId);
            if (!data) {
                nodo.active = false;
                return;
            }

            nodo.active = true;
            const cardView = nodo.getComponent(CardView);
            const encantamiento = obtenerEncantamientoCarta(rawCartaId);
            const gratisEsteTurno = esCartaGratisEsteTurno(rawCartaId);

            const costoReal = CalculadoraCombate.calcularCostoCarta(
                data.costo,
                data.reduccionCostoPorHpPerdido,
                miJugador.hpPerdidoCombate || 0,
                encantamiento,
                gratisEsteTurno
            );

            const alcanzaEnergia = miJugador.energia >= costoReal;
            const alcanzaOro = !data.costoOro || miJugador.oro >= data.costoOro;
            const cumpleObjetivoAliado =
                data.objetivoSeleccion !== "ALIADO" || hayOtroAliadoVivo;
            const cumpleRequisitoClash =
                !data.requiereManoSoloAtaques || todasSonAtaque;

            const puedePagarse =
                !miJugador.turnoTerminado &&
                !data.injugable &&
                alcanzaEnergia &&
                alcanzaOro &&
                cumpleObjetivoAliado &&
                cumpleRequisitoClash;

            const otrosAtaquesEnMano =
                data.tipo === "ATAQUE"
                    ? Math.max(0, totalAtaquesEnMano - 1)
                    : totalAtaquesEnMano;

            cardView?.configurar(
                i,
                data,
                puedePagarse,
                (indice, objetivoId) => NetworkManager.instance?.jugarCarta(indice, objetivoId),
                (tipo, touchPos) => this.detectarObjetivoBajoCursor(tipo, touchPos),
                miJugador.estados,
                (objetivoId) => this.datosEnemigosPorUid.get(objetivoId)?.estados,
                puedePagarse,
                {
                    bloqueoLanzador: miJugador.bloqueo,
                    ataquesEnMano: otrosAtaquesEnMano,
                    hpPerdidoCombate: miJugador.hpPerdidoCombate || 0
                },
                encantamiento,
                gratisEsteTurno
            );
        });
    }

    private obtenerCardViewDesdeMano(cartaInstanciaId: string): CardView | undefined {
        for (const nodo of this.nodosCartas) {
            if (!nodo.active) continue;
            // Podrías necesitar comparar el ID interno si lo guardas, 
            // o simplemente tomar el primero disponible.
            // Para asegurar precisión, sería ideal guardar la ID en el CardView.
            // Por simplicidad en la UI de cartas en mano, tomamos el CardView
            // que tenga configurada esa carta (requerirá añadir un getCartaId() en CardView, 
            // o lo hacemos genérico por posición).
            
            const cardView = nodo.getComponent(CardView);
            // Esto asume que el CardView expone el ID; si no, lo editaremos.
            if (cardView && (cardView as any).cartaData?.id === cartaInstanciaId) {
                return cardView;
            }
        }
        return undefined;
    }

    private detectarObjetivoBajoCursor(tipo: "ENEMIGO" | "ALIADO", touchPos: Vec3): string | undefined {
        const miId = NetworkManager.instance?.room?.sessionId;
        const mapaVistas = tipo === "ENEMIGO" ? this.vistasEnemigos : this.vistasAliados;

        for (const [id, vista] of mapaVistas.entries()) {
            if (tipo === "ALIADO" && id === miId) continue;

            if (vista.contienePuntoMundo(touchPos)) {
                return id;
            }
        }
        return undefined;
    }

    public onClickTerminarTurno() {
        NetworkManager.instance?.terminarTurno();
    }

    public onClickAbrirPilaDescarte() {
        this.visorMazo?.abrirModoPilaCombate("DESCARTE");
    }

    public onClickAbrirPilaRobo() {
        this.visorMazo?.abrirModoPilaCombate("ROBO");
    }

    public onClickAbrirPilaAgotadas() {
        this.visorMazo?.abrirModoPilaCombate("AGOTADAS");
    }
}