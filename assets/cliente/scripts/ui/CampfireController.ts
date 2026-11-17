import { _decorator, Component, Node, Label, Button, Color, instantiate } from "cc";
import { NetworkManager, NetworkEvents, EVENTO_ESTADO_ACTUALIZADO } from "../network/NetworkManager";
import {
    ECONOMIA_CONFIG,
    IEstadoSalaCliente,
    IJugadorCliente,
    PERSONAJES_INFO,
    PersonajeId
} from "../../compartido/GameTypes";
import { puedeMejorarseCarta } from "../../compartido/Cartas";
import { DeckViewerController } from "./DeckViewerController";

const { ccclass, property } = _decorator;

type OpcionPrincipalFogata = "NINGUNA" | "CURAR_PROPIO" | "MEJORAR_CARTA" | "CURAR_ALIADO";

@ccclass("CampfireController")
export class CampfireController extends Component {
    @property(Label) labelTitulo: Label = null!;

    // Contenedor de las 3 opciones principales
    @property(Node) panelOpcionesPrincipales: Node = null!;
    @property(Button) btnOpcionCurarPropio: Button = null!;
    @property(Label) labelDetalleCurarPropio: Label = null!;

    @property(Button) btnOpcionMejorarCarta: Button = null!;
    @property(Label) labelDetalleMejorarCarta: Label = null!;

    @property(Button) btnOpcionCurarAliado: Button = null!;
    @property(Label) labelDetalleCurarAliado: Label = null!;

    @property(Button) btnContinuarPrincipal: Button = null!;
    @property(Label) labelBtnContinuarPrincipal: Label = null!;

    // Submenú para seleccionar a qué aliado curar (con botón Confirmar y Volver)
    @property(Node) panelSeleccionAliado: Node = null!;
    @property(Node) contenedorBotonesAliados: Node = null!;
    @property(Node) templateBotonAliado: Node = null!;
    @property(Button) btnConfirmarCurarAliado: Button = null!;
    @property(Button) btnVolverDesdeAliados: Button = null!;

    // Referencia al Visor de Mazo para abrir el modo FORJA
    @property(DeckViewerController) visorMazo: DeckViewerController = null!;

    private opcionSeleccionada: OpcionPrincipalFogata = "NINGUNA";
    private aliadoSeleccionadoId: string = "";
    private nodosAliados: Node[] = [];
    private idsAliadosMostrados: string[] = [];
    private enSubmenuAliados: boolean = false;

    onLoad() {
        if (this.templateBotonAliado) this.templateBotonAliado.active = false;
    }

    onEnable() {
        this.opcionSeleccionada = "NINGUNA";
        this.aliadoSeleccionadoId = "";
        this.enSubmenuAliados = false;
        if (this.panelSeleccionAliado) this.panelSeleccionAliado.active = false;
        if (this.panelOpcionesPrincipales) this.panelOpcionesPrincipales.active = true;

        NetworkEvents.on(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoCambiado, this);
        if (NetworkManager.instance?.room?.state) {
            this.onEstadoCambiado(NetworkManager.instance.room.state);
        }
    }

    onDisable() {
        NetworkEvents.off(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoCambiado, this);
    }

    private onEstadoCambiado(state: IEstadoSalaCliente) {
        if (state.faseActual !== "CAMPFIRE") return;

        const miId = NetworkManager.instance?.room?.sessionId;
        const miJugador = miId ? state.jugadores.get(miId) : undefined;
        if (!miJugador) return;

        if (miJugador.fogataCompletada) {
            if (this.labelTitulo) {
                this.labelTitulo.string = "🔥 Acción completada en la Fogata. Esperando a tus aliados...";
            }
            if (this.panelOpcionesPrincipales) this.panelOpcionesPrincipales.active = false;
            if (this.panelSeleccionAliado) this.panelSeleccionAliado.active = false;
            this.visorMazo?.cerrarVisor();
            return;
        }

        if (this.enSubmenuAliados) {
            this.renderizarSubmenuAliados(state, miId!);
        } else {
            this.renderizarMenuPrincipal(state, miJugador, miId!);
        }
    }

    private renderizarMenuPrincipal(
        state: IEstadoSalaCliente,
        miJugador: IJugadorCliente,
        miId: string
    ) {
        if (this.panelOpcionesPrincipales) this.panelOpcionesPrincipales.active = true;
        if (this.panelSeleccionAliado) this.panelSeleccionAliado.active = false;

        if (this.labelTitulo) {
            this.labelTitulo.string = "🔥 Fogata — Elegí una opción y dale a Continuar";
        }

        // 1. Curarse a sí mismo (30% HP máx) en tiempo real
        const curacionPropia = Math.max(
            1,
            Math.floor(miJugador.hpMax * ECONOMIA_CONFIG.PORCENTAJE_CURACION_FOGATA)
        );
        if (this.labelDetalleCurarPropio) {
            const marca = this.opcionSeleccionada === "CURAR_PROPIO" ? "✅ " : "";
            this.labelDetalleCurarPropio.string = `${marca}Descansar (+${curacionPropia} HP)\nTu Vida: ${miJugador.hp}/${miJugador.hpMax}`;
            this.labelDetalleCurarPropio.color =
                this.opcionSeleccionada === "CURAR_PROPIO"
                    ? new Color(130, 255, 150)
                    : new Color(255, 255, 255);
        }

        // 2. Mejorar una carta (Forjar)
        const mazo = Array.from(miJugador.mazoMaestro || []);
        const cantMejorables = mazo.filter((id) => puedeMejorarseCarta(id)).length;
        if (this.btnOpcionMejorarCarta) {
            this.btnOpcionMejorarCarta.interactable = cantMejorables > 0;
        }
        if (this.labelDetalleMejorarCarta) {
            const marca = this.opcionSeleccionada === "MEJORAR_CARTA" ? "✅ " : "";
            this.labelDetalleMejorarCarta.string =
                cantMejorables > 0
                    ? `${marca}Forjar (Mejorar 1 carta)\n${cantMejorables} mejorables en tu mazo`
                    : "Forjar (Sin cartas mejorables)";
            this.labelDetalleMejorarCarta.color =
                this.opcionSeleccionada === "MEJORAR_CARTA"
                    ? new Color(130, 255, 150)
                    : new Color(255, 255, 255);
        }

        // 3. Curar a un aliado (deshabilitado si está solo)
        let cantAliados = 0;
        state.jugadores.forEach((_j, id) => {
            if (id !== miId) cantAliados++;
        });

        if (this.btnOpcionCurarAliado) {
            this.btnOpcionCurarAliado.interactable = cantAliados > 0;
        }
        if (this.labelDetalleCurarAliado) {
            const marca = this.opcionSeleccionada === "CURAR_ALIADO" ? "✅ " : "";
            this.labelDetalleCurarAliado.string =
                cantAliados > 0
                    ? `${marca}Curar a un Aliado (+30% HP)\n${cantAliados} aliado(s) en el grupo`
                    : "Curar a un Aliado (Solo en cooperativo)";
            this.labelDetalleCurarAliado.color =
                this.opcionSeleccionada === "CURAR_ALIADO"
                    ? new Color(130, 255, 150)
                    : new Color(160, 160, 160);
        }

        if (this.btnContinuarPrincipal) {
            this.btnContinuarPrincipal.interactable = this.opcionSeleccionada !== "NINGUNA";
        }
        if (this.labelBtnContinuarPrincipal) {
            this.labelBtnContinuarPrincipal.string =
                this.opcionSeleccionada === "CURAR_PROPIO"
                    ? `Continuar (Curarme +${curacionPropia} HP)`
                    : this.opcionSeleccionada === "MEJORAR_CARTA"
                    ? "Continuar (Elegir carta a forjar)"
                    : this.opcionSeleccionada === "CURAR_ALIADO"
                    ? "Continuar (Elegir aliado)"
                    : "Seleccioná una opción";
        }
    }

    private renderizarSubmenuAliados(state: IEstadoSalaCliente, miId: string) {
        if (this.panelOpcionesPrincipales) this.panelOpcionesPrincipales.active = false;
        if (this.panelSeleccionAliado) this.panelSeleccionAliado.active = true;

        if (this.labelTitulo) {
            this.labelTitulo.string = "💚 Seleccioná a qué aliado curar (+30% de su HP Máx)";
        }

        const aliados: IJugadorCliente[] = [];
        state.jugadores.forEach((j: IJugadorCliente, id: string) => {
            if (id !== miId) aliados.push(j);
        });

        while (this.nodosAliados.length < aliados.length && this.templateBotonAliado) {
            const idx = this.nodosAliados.length;
            const nodo = instantiate(this.templateBotonAliado);
            this.contenedorBotonesAliados?.addChild(nodo);
            if (!nodo.getComponent(Button)) nodo.addComponent(Button);
            nodo.on(
                Button.EventType.CLICK,
                () => {
                    const idElegido = this.idsAliadosMostrados[idx];
                    if (idElegido) {
                        this.aliadoSeleccionadoId = idElegido;
                        const st = NetworkManager.instance?.room?.state;
                        if (st) this.renderizarSubmenuAliados(st, miId);
                    }
                },
                this
            );
            this.nodosAliados.push(nodo);
        }

        this.idsAliadosMostrados = [];
        this.nodosAliados.forEach((nodo, i) => {
            if (i >= aliados.length) {
                nodo.active = false;
                return;
            }

            const aliado = aliados[i];
            this.idsAliadosMostrados[i] = aliado.sessionId;
            nodo.active = true;

            const curacion = Math.max(
                1,
                Math.floor(aliado.hpMax * ECONOMIA_CONFIG.PORCENTAJE_CURACION_FOGATA)
            );
            const seleccionado = this.aliadoSeleccionadoId === aliado.sessionId;
            const infoPj = PERSONAJES_INFO[aliado.personajeId as PersonajeId];
            const nombrePj = infoPj ? infoPj.nombre : aliado.personajeId;

            const lbl = nodo.getComponent(Label) || nodo.getComponentInChildren(Label);
            if (lbl) {
                const check = seleccionado ? "✅ " : "";
                lbl.string = `${check}${aliado.nombre} (${nombrePj}) — HP: ${aliado.hp}/${aliado.hpMax} (+${curacion} HP)`;
                lbl.color = seleccionado ? new Color(130, 255, 150) : new Color(255, 255, 255);
            }
        });

        if (this.btnConfirmarCurarAliado) {
            this.btnConfirmarCurarAliado.interactable = Boolean(this.aliadoSeleccionadoId);
        }
    }

    // Asignar a Click Events de los 3 botones de opción en la fogata
    public onClickSeleccionarCurarPropio() {
        this.opcionSeleccionada = "CURAR_PROPIO";
        this.refrescarVistaActual();
    }

    public onClickSeleccionarMejorarCarta() {
        this.opcionSeleccionada = "MEJORAR_CARTA";
        this.refrescarVistaActual();
    }

    public onClickSeleccionarCurarAliado() {
        this.opcionSeleccionada = "CURAR_ALIADO";
        this.refrescarVistaActual();
    }

    // Asignar al botón "Continuar" del menú principal de la fogata
    public onClickContinuarPrincipal() {
        if (this.opcionSeleccionada === "CURAR_PROPIO") {
            NetworkManager.instance?.enviarAccionFogata({ tipo: "CURAR_PROPIO" });
        } else if (this.opcionSeleccionada === "MEJORAR_CARTA") {
            this.visorMazo?.abrirModoForja(
                (indiceMazo) => {
                    NetworkManager.instance?.enviarAccionFogata({
                        tipo: "MEJORAR_CARTA",
                        indiceMazo
                    });
                },
                () => {
                    this.refrescarVistaActual();
                }
            );
        } else if (this.opcionSeleccionada === "CURAR_ALIADO") {
            this.enSubmenuAliados = true;
            this.aliadoSeleccionadoId = "";
            this.refrescarVistaActual();
        }
    }

    // Asignar al botón "Continuar / Confirmar" dentro del submenú de aliados
    public onClickConfirmarCurarAliado() {
        if (!this.aliadoSeleccionadoId) return;
        NetworkManager.instance?.enviarAccionFogata({
            tipo: "CURAR_ALIADO",
            aliadoSessionId: this.aliadoSeleccionadoId
        });
    }

    // Asignar al botón "Volver" dentro del submenú de aliados
    public onClickVolverAlMenuFogata() {
        this.enSubmenuAliados = false;
        this.aliadoSeleccionadoId = "";
        this.refrescarVistaActual();
    }

    private refrescarVistaActual() {
        const state = NetworkManager.instance?.room?.state;
        if (state) this.onEstadoCambiado(state);
    }
}