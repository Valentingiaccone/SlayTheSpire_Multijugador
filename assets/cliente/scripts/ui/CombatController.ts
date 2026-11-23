import { _decorator, Component, Node, Label, Button, instantiate, Vec3, Prefab, Layout } from "cc";
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
import { CardVfxController } from "../visual/CardVfxController";
import { IContextoVisualCartaVfx } from "../visual/CartaVisualVfx";

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
    @property(CardVfxController) vfxCartas: CardVfxController = null!;

    private vistasEnemigos: Map<string, CombatEntityView> = new Map();
    private vistasAliados: Map<string, CombatEntityView> = new Map();
    private datosEnemigosPorUid: Map<string, IEnemigoCliente> = new Map();
    private nodosCartas: Node[] = [];
    private secuenciador!: CombatSequencer;

    private ultimasPosicionesCartasMano: Vec3[] = [];
    private ultimaPosCartaJugadaMundo: { indiceMano: number; pos: Vec3; timestamp: number } | null = null;

    // Control de "slots fantasma" para revelar cada carta en el instante exacto en que aterriza
    private cartasOcultasAlFinalMano: number = 0;
    private cartasEnVueloRobo: number = 0;
    private lotesRoboPendientes: string[][] = [];
    private estadoManoListoParaRobo: boolean = true;
    private ultimaFirmaMazoYMano: string = "";
    private timestampUltimoCambioMazo: number = 0;

    onLoad() {
        if (this.templateEnemigo) this.templateEnemigo.active = false;
        if (this.templateAliado) this.templateAliado.active = false;

        this.secuenciador = new CombatSequencer(
            (id) => this.vistasEnemigos.get(id) || this.vistasAliados.get(id),
            () => {
                // Red de seguridad: si no quedó ningún vuelo pendiente, asegurar toda la mano visible
                if (this.cartasEnVueloRobo === 0 && this.lotesRoboPendientes.length === 0) {
                    this.cartasOcultasAlFinalMano = 0;
                }
                const state = NetworkManager.instance?.room?.state;
                if (state) this.onEstadoCambiado(state);
            },
            (ev) => this.manejarEventoVfxCarta(ev)
        );
    }

    onEnable() {
        this.resetearEstadoVfxMano();
        NetworkEvents.on(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoCambiado, this);
        NetworkEvents.on(EVENTO_SECUENCIA_COMBATE, this.onSecuenciaRecibida, this);
        if (NetworkManager.instance?.room?.state) {
            this.onEstadoCambiado(NetworkManager.instance.room.state);
        }
    }

    onDisable() {
        NetworkEvents.off(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoCambiado, this);
        NetworkEvents.off(EVENTO_SECUENCIA_COMBATE, this.onSecuenciaRecibida, this);
        this.unscheduleAllCallbacks();
        this.secuenciador?.limpiar();
        this.tooltipCombate?.ocultar();
        this.vfxCartas?.limpiar();
        this.resetearEstadoVfxMano();
    }

    private resetearEstadoVfxMano(): void {
        this.cartasOcultasAlFinalMano = 0;
        this.cartasEnVueloRobo = 0;
        this.lotesRoboPendientes = [];
        this.estadoManoListoParaRobo = true;
        this.ultimaFirmaMazoYMano = "";
        this.timestampUltimoCambioMazo = 0;
        this.ultimaPosCartaJugadaMundo = null;
        this.ultimasPosicionesCartasMano = [];

        this.nodosCartas.forEach((nodo) => {
            if (nodo && nodo.isValid) {
                nodo.getComponent(CardView)?.setOcultoPorVfx(false);
            }
        });
    }

    private onSecuenciaRecibida(eventos: EventoVisualCombate[]) {
        const miId = NetworkManager.instance?.room?.sessionId;

        if (miId && this.vfxCartas && eventos && eventos.length > 0) {
            // 1. Capturamos las posiciones actuales de la mano ANTES de que llegue el nuevo estado
            this.capturarPosicionesActualesMano();

            // 2. Contamos cuántas cartas nuevas se van a robar en este lote para reservar sus slots
            let totalRobosEnLote = 0;
            for (const ev of eventos) {
                if (ev.tipo === "CARTAS_ROBADAS" && ev.jugadorId === miId) {
                    totalRobosEnLote += ev.cartasIds?.length ?? ev.cantidad;
                }
            }

            if (totalRobosEnLote > 0) {
                this.cartasOcultasAlFinalMano += totalRobosEnLote;
                const patchRecienLlegado = Date.now() - this.timestampUltimoCambioMazo < 80;
                this.estadoManoListoParaRobo = patchRecienLlegado;

                if (patchRecienLlegado) {
                    const state = NetworkManager.instance?.room?.state;
                    const miJugador = state?.jugadores.get(miId);
                    if (miJugador) {
                        this.aplicarVisibilidadSlotsOcultos(miJugador.mano.length);
                    }
                }
            }
        }

        this.secuenciador.encolarLote(eventos);
    }

    private manejarEventoVfxCarta(ev: EventoVisualCombate): number | void {
        if (!this.vfxCartas) return;
        const miId = NetworkManager.instance?.room?.sessionId;
        if (!miId) return;

        const contexto = this.construirContextoVisualCarta();

        switch (ev.tipo) {
            case "CARTA_JUGADA": {
                if (ev.jugadorId !== miId) return;

                let posOrigen: Vec3;
                const posReciente = this.ultimaPosCartaJugadaMundo;
                if (
                    posReciente &&
                    Date.now() - posReciente.timestamp < 1500 &&
                    (ev.indiceMano === undefined || posReciente.indiceMano === ev.indiceMano)
                ) {
                    posOrigen = posReciente.pos;
                    this.ultimaPosCartaJugadaMundo = null;
                } else if (typeof ev.indiceMano === "number") {
                    posOrigen = this.obtenerPosicionCartaEnMano(ev.indiceMano);
                } else {
                    posOrigen = this.contenedorMano
                        ? this.contenedorMano.worldPosition.clone()
                        : new Vec3();
                }

                if (ev.destinoCarta === "AGOTADAS") {
                    this.vfxCartas.reproducirCartaAgotada(ev.cartaId, posOrigen, 0, contexto);
                } else if (ev.destinoCarta === "PODER") {
                    const vistaMia = this.vistasAliados.get(miId);
                    if (vistaMia) {
                        this.vfxCartas.lanzarCartaHaciaPersonaje(
                            ev.cartaId,
                            posOrigen,
                            vistaMia.node.worldPosition.clone(),
                            0,
                            contexto
                        );
                    }
                } else {
                    this.vfxCartas.lanzarCartaHaciaDescarte(ev.cartaId, posOrigen, 0, contexto);
                }
                return;
            }

            case "CARTAS_DESCARTADAS": {
                if (ev.jugadorId !== miId) return;

                const mostrarSobreManoVieja = !this.estadoManoListoParaRobo;
                ev.cartas.forEach((item, orden) => {
                    const pos = this.obtenerPosicionCartaEnMano(item.indiceMano);
                    const delay = orden * 0.045;

                    // Oculta la carta saliente de inmediato para que no se duplique durante el vuelo
                    if (mostrarSobreManoVieja) {
                        const nodo = this.nodosCartas[item.indiceMano];
                        if (nodo && nodo.isValid && nodo.active) {
                            nodo.getComponent(CardView)?.setOcultoPorVfx(true);
                        }
                    }

                    if (ev.destino === "AGOTADAS") {
                        this.vfxCartas.reproducirCartaAgotada(item.cartaId, pos, delay, contexto);
                    } else {
                        this.vfxCartas.lanzarCartaHaciaDescarte(item.cartaId, pos, delay, contexto);
                    }
                });
                return;
            }

            case "MAZO_MEZCLADO": {
                if (ev.jugadorId !== miId) return;
                const duracionSeg = this.vfxCartas.reproducirMezclaDescarteARobo(ev.cantidadCartas);
                return Math.ceil(duracionSeg * 1000);
            }

            case "CARTAS_ROBADAS": {
                if (ev.jugadorId !== miId) return;
                const ids = ev.cartasIds || [];
                if (ids.length === 0) return;

                this.lotesRoboPendientes.push(ids);

                if (this.estadoManoListoParaRobo) {
                    this.procesarLotesRoboPendientes();
                } else {
                    // Respaldo de seguridad por si el estado demorara en llegar
                    this.scheduleOnce(() => {
                        if (this.lotesRoboPendientes.length > 0) {
                            this.estadoManoListoParaRobo = true;
                            this.procesarLotesRoboPendientes();
                        }
                    }, 0.25);
                }
                return;
            }
        }
    }

    private procesarLotesRoboPendientes(): void {
        if (!this.estadoManoListoParaRobo || this.lotesRoboPendientes.length === 0) return;

        const state = NetworkManager.instance?.room?.state;
        const miId = NetworkManager.instance?.room?.sessionId;
        const miJugador = miId && state ? state.jugadores.get(miId) : undefined;
        if (!miJugador || !this.vfxCartas) {
            this.lotesRoboPendientes = [];
            this.cartasOcultasAlFinalMano = 0;
            this.cartasEnVueloRobo = 0;
            return;
        }

        // Forzamos el Layout para garantizar que cada slot tenga su worldPosition final exacta
        this.contenedorMano?.getComponent(Layout)?.updateLayout(true);

        const totalMano = miJugador.mano.length;
        const contexto = this.construirContextoVisualCarta();

        while (this.lotesRoboPendientes.length > 0) {
            const cartasIds = this.lotesRoboPendientes.shift()!;

            for (let i = 0; i < cartasIds.length; i++) {
                const idxSlot = totalMano - this.cartasOcultasAlFinalMano + this.cartasEnVueloRobo;
                const nodoDestino = this.nodosCartas[idxSlot];

                if (idxSlot < 0 || idxSlot >= totalMano || !nodoDestino || !nodoDestino.active) {
                    this.cartasOcultasAlFinalMano = Math.max(0, this.cartasOcultasAlFinalMano - 1);
                    this.aplicarVisibilidadSlotsOcultos(totalMano);
                    continue;
                }

                const posDestino = nodoDestino.worldPosition.clone();
                const delay = i * (this.vfxCartas.delayEntreCartasSeg ?? 0.055);
                this.cartasEnVueloRobo += 1;

                this.vfxCartas.lanzarCartaDesdeRoboAMano(
                    cartasIds[i],
                    posDestino,
                    delay,
                    contexto,
                    () => this.alAterrizarCartaRobada()
                );
            }
        }
    }

    private alAterrizarCartaRobada(): void {
        this.cartasOcultasAlFinalMano = Math.max(0, this.cartasOcultasAlFinalMano - 1);
        this.cartasEnVueloRobo = Math.max(0, this.cartasEnVueloRobo - 1);

        const state = NetworkManager.instance?.room?.state;
        const miId = NetworkManager.instance?.room?.sessionId;
        const miJugador = miId && state ? state.jugadores.get(miId) : undefined;
        const totalMano = miJugador ? miJugador.mano.length : this.nodosCartas.length;

        this.aplicarVisibilidadSlotsOcultos(totalMano);
    }

    private aplicarVisibilidadSlotsOcultos(totalMano: number): void {
        const ocultasEfectivas = Math.min(this.cartasOcultasAlFinalMano, totalMano);
        const inicioOcultas = Math.max(0, totalMano - ocultasEfectivas);

        for (let i = 0; i < totalMano; i++) {
            const nodo = this.nodosCartas[i];
            if (!nodo || !nodo.isValid) continue;
            nodo.getComponent(CardView)?.setOcultoPorVfx(i >= inicioOcultas);
        }
    }

    private capturarPosicionesActualesMano(): void {
        this.nodosCartas.forEach((nodo, idx) => {
            if (nodo && nodo.isValid && nodo.active) {
                this.ultimasPosicionesCartasMano[idx] = nodo.worldPosition.clone();
            }
        });
    }

    private construirContextoVisualCarta(): IContextoVisualCartaVfx | undefined {
        const state = NetworkManager.instance?.room?.state;
        const miId = NetworkManager.instance?.room?.sessionId;
        const miJugador = miId && state ? state.jugadores.get(miId) : undefined;
        if (!miJugador) return undefined;

        return {
            estadosLanzador: miJugador.estados,
            contextoExtra: {
                bloqueoLanzador: miJugador.bloqueo,
                hpPerdidoCombate: miJugador.hpPerdidoCombate || 0
            }
        };
    }

    private obtenerPosicionCartaEnMano(indiceMano: number): Vec3 {
        if (this.ultimasPosicionesCartasMano[indiceMano]) {
            return this.ultimasPosicionesCartasMano[indiceMano].clone();
        }
        const nodo = this.nodosCartas[indiceMano];
        if (nodo && nodo.isValid && nodo.active) {
            return nodo.worldPosition.clone();
        }
        return this.contenedorMano ? this.contenedorMano.worldPosition.clone() : new Vec3();
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
        this.renderizarAliados(state.jugadores, animando, state.turnoNumero);
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
        bloquearHpYBloqueo: boolean,
        turnoNumero: number
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
                this.renderizarMano(j, hayOtroAliadoVivo, turnoNumero);
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

    private renderizarMano(
        miJugador: IJugadorCliente,
        hayOtroAliadoVivo: boolean,
        turnoNumero: number
    ) {
        if (!this.contenedorMano || !this.templateCarta) return;

        const firmaActual = `${turnoNumero}|${miJugador.cantPilaRobo}|${miJugador.cantDescarte}|${miJugador.cantAgotadas}|${Array.from(miJugador.mano).join(",")}`;
        const cambioMazoOMano = firmaActual !== this.ultimaFirmaMazoYMano;

        if (!cambioMazoOMano) {
            this.capturarPosicionesActualesMano();
        }

        while (this.nodosCartas.length < miJugador.mano.length) {
            const nodo = instantiate(this.templateCarta);
            this.contenedorMano.addChild(nodo);
            this.nodosCartas.push(nodo);
        }

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
                (indice, objetivoId, posOrigenMundo) => {
                    if (posOrigenMundo) {
                        this.ultimaPosCartaJugadaMundo = {
                            indiceMano: indice,
                            pos: posOrigenMundo.clone(),
                            timestamp: Date.now()
                        };
                    }
                    NetworkManager.instance?.jugarCarta(indice, objetivoId);
                },
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

        // Recalcula el Layout en el acto para conocer la posición exacta de cada carta (incluida las ocultas)
        this.contenedorMano.getComponent(Layout)?.updateLayout(true);
        this.aplicarVisibilidadSlotsOcultos(miJugador.mano.length);

        if (cambioMazoOMano) {
            this.ultimaFirmaMazoYMano = firmaActual;
            this.timestampUltimoCambioMazo = Date.now();
            this.estadoManoListoParaRobo = true;
            this.procesarLotesRoboPendientes();
        }
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