import { _decorator, Component, Node, Label, Button, Sprite, Color, instantiate } from "cc";
import { NetworkManager, NetworkEvents, EVENTO_ESTADO_ACTUALIZADO } from "../network/NetworkManager";
import {
    IEstadoSalaCliente,
    IJugadorCliente,
    PERSONAJES_INFO,
    PersonajeId
} from "../../compartido/GameTypes";
import {
    CATALOGO_EVENTOS,
    IEventoData,
    IOpcionEventoData,
    formatearTextoOpcionEvento,
    opcionRequiereElegirCartaMazo,
    validarRequisitosOpcionParaJugador
} from "../../compartido/Eventos";
import { CATALOGO_CARTAS } from "../../compartido/Cartas";
import { CATALOGO_RELIQUIAS } from "../../compartido/Reliquias";
import { SpriteManager } from "../utils/SpriteManager";
import { CardView } from "./CardView";
import { DeckViewerController } from "./DeckViewerController";

const { ccclass, property } = _decorator;

@ccclass("EventController")
export class EventController extends Component {
    @property(Label) labelTituloEvento: Label = null!;
    @property(Label) labelDescripcionEvento: Label = null!;
    @property(Label) labelEstadoEvento: Label = null!;

    @property(Node) contenedorOpciones: Node = null!;
    @property(Node) templateBotonOpcion: Node = null!;

    @property(Button) btnContinuarIndividual: Button = null!;
    @property(Label) labelBtnContinuar: Label = null!;

    @property(Node) contenedorPrevisualizacion: Node = null!;
    @property(CardView) cartaRecompensaPreview: CardView = null!;
    @property(CardView) cartaMaldicionPreview: CardView = null!;
    @property(Node) nodoReliquiaPreview: Node = null!;
    @property(Sprite) spriteReliquiaPreview: Sprite = null!;
    @property(Label) labelReliquiaPreview: Label = null!;

    @property(DeckViewerController) visorMazo: DeckViewerController = null!;

    private nodosOpciones: Node[] = [];
    private opcionSeleccionadaIdx: number = -1;
    private ultimoEventoId: string = "";

    onLoad() {
        if (this.templateBotonOpcion) this.templateBotonOpcion.active = false;
    }

    onEnable() {
        this.opcionSeleccionadaIdx = -1;
        this.ultimoEventoId = "";
        NetworkEvents.on(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoCambiado, this);
        if (NetworkManager.instance?.room?.state) {
            this.onEstadoCambiado(NetworkManager.instance.room.state);
        }
    }

    onDisable() {
        NetworkEvents.off(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoCambiado, this);
    }

    private onEstadoCambiado(state: IEstadoSalaCliente) {
        if (state.faseActual !== "EVENT") return;

        const evento = CATALOGO_EVENTOS[state.eventoActualId];
        if (!evento) return;

        const miId = NetworkManager.instance?.room?.sessionId;
        const miJugador = miId ? state.jugadores.get(miId) : undefined;
        if (!miJugador) return;

        if (this.ultimoEventoId !== evento.id) {
            this.ultimoEventoId = evento.id;
            this.opcionSeleccionadaIdx = -1;
        }

        if (this.labelTituloEvento) this.labelTituloEvento.string = evento.titulo;
        if (this.labelDescripcionEvento) this.labelDescripcionEvento.string = evento.descripcion;

        if (evento.modo === "INDIVIDUAL") {
            this.renderizarModoIndividual(state, evento, miJugador);
        } else {
            this.renderizarModoComunitario(state, evento, miJugador);
        }
    }

    private renderizarModoIndividual(
        state: IEstadoSalaCliente,
        evento: IEventoData,
        miJugador: IJugadorCliente
    ) {
        if (miJugador.eventoCompletado) {
            let listos = 0;
            let total = 0;
            state.jugadores.forEach((j: IJugadorCliente) => {
                total++;
                if (j.eventoCompletado) listos++;
            });

            if (this.labelEstadoEvento) {
                this.labelEstadoEvento.string = `✅ Decisión tomada. Esperando a tus aliados (${listos}/${total})...`;
            }
            this.nodosOpciones.forEach((n) => (n.active = false));
            if (this.btnContinuarIndividual) this.btnContinuarIndividual.node.active = false;
            if (this.contenedorPrevisualizacion) this.contenedorPrevisualizacion.active = false;
            this.visorMazo?.cerrarVisor();
            return;
        }

        if (this.labelEstadoEvento) {
            this.labelEstadoEvento.string = `👤 Evento Individual — Tu HP: ${miJugador.hp}/${miJugador.hpMax} | 💰 Oro: ${miJugador.oro}`;
        }

        this.asegurarCantidadBotones(evento.opciones.length);

        evento.opciones.forEach((opcion, idx) => {
            const nodo = this.nodosOpciones[idx];
            nodo.active = true;

            const cartaId = miJugador.eventoOpcionCartas?.[idx] || "";
            const reliquiaId = miJugador.eventoOpcionReliquias?.[idx] || "";
            const maldicionId = miJugador.eventoOpcionMaldiciones?.[idx] || "";

            const validacion = validarRequisitosOpcionParaJugador(opcion, {
                hp: miJugador.hp,
                hpMax: miJugador.hpMax,
                oro: miJugador.oro,
                mazoLength: miJugador.mazoMaestro?.length || 0,
                mazoCartasIds: miJugador.mazoMaestro
            });

            const seleccionada = this.opcionSeleccionadaIdx === idx;
            const textoBaseFormateado = formatearTextoOpcionEvento(
                opcion,
                cartaId,
                reliquiaId,
                maldicionId,
                miJugador.hpMax
            );

            const prefijo = !validacion.valida
                ? `🔒 [BLOQUEADO: ${validacion.motivoBloqueo}] `
                : seleccionada
                ? "✅ "
                : "";

            const lbl = nodo.getComponent(Label) || nodo.getComponentInChildren(Label);
            if (lbl) {
                lbl.string = `${prefijo}${textoBaseFormateado}`;
                lbl.color = !validacion.valida
                    ? new Color(150, 150, 150)
                    : seleccionada
                    ? new Color(130, 255, 150)
                    : new Color(255, 255, 255);
            }

            const btn = nodo.getComponent(Button);
            if (btn) btn.interactable = validacion.valida;
        });

        for (let i = evento.opciones.length; i < this.nodosOpciones.length; i++) {
            this.nodosOpciones[i].active = false;
        }

        if (this.btnContinuarIndividual) {
            this.btnContinuarIndividual.node.active = true;
            this.btnContinuarIndividual.interactable = this.opcionSeleccionadaIdx >= 0;
        }

        if (this.labelBtnContinuar) {
            if (this.opcionSeleccionadaIdx < 0) {
                this.labelBtnContinuar.string = "Seleccioná una opción";
            } else {
                const opElegida = evento.opciones[this.opcionSeleccionadaIdx];
                this.labelBtnContinuar.string =
                    opElegida && opcionRequiereElegirCartaMazo(opElegida)
                        ? "Continuar (Elegir carta a eliminar)"
                        : "Continuar (Confirmar)";
            }
        }

        this.actualizarPrevisualizacion(miJugador, this.opcionSeleccionadaIdx);
    }

    private renderizarModoComunitario(
        state: IEstadoSalaCliente,
        evento: IEventoData,
        miJugador: IJugadorCliente
    ) {
        if (this.btnContinuarIndividual) {
            this.btnContinuarIndividual.node.active = false;
        }

        if (this.labelEstadoEvento) {
            if (state.hayEmpateEvento) {
                this.labelEstadoEvento.string = "⚖️ ¡EMPATE EN LA VOTACIÓN! Dialoguen y cambien su voto";
            } else if (state.tiempoCuentaRegresivaEvento > 0) {
                this.labelEstadoEvento.string = `🤝 Decisión grupal tomada — Ejecutando en ${state.tiempoCuentaRegresivaEvento}s...`;
            } else {
                let votaron = 0;
                let total = 0;
                state.jugadores.forEach((j: IJugadorCliente) => {
                    total++;
                    if (j.eventoVotoOpcion >= 0) votaron++;
                });
                this.labelEstadoEvento.string = `🤝 Evento Comunitario (Mayoría decide) — Votos: ${votaron}/${total}`;
            }
        }

        const votantesPorOpcion: Map<number, PersonajeId[]> = new Map();
        state.jugadores.forEach((j: IJugadorCliente) => {
            if (j.eventoVotoOpcion >= 0) {
                const lista = votantesPorOpcion.get(j.eventoVotoOpcion) || [];
                lista.push(j.personajeId);
                votantesPorOpcion.set(j.eventoVotoOpcion, lista);
            }
        });

        this.asegurarCantidadBotones(evento.opciones.length);

        evento.opciones.forEach((opcion, idx) => {
            const nodo = this.nodosOpciones[idx];
            nodo.active = true;

            const validacionGrupo = this.validarOpcionComunitariaEnGrupo(state, opcion);
            const cartaId = miJugador.eventoOpcionCartas?.[idx] || "";
            const reliquiaId = miJugador.eventoOpcionReliquias?.[idx] || "";
            const maldicionId = miJugador.eventoOpcionMaldiciones?.[idx] || "";

            const laVoteYo = miJugador.eventoVotoOpcion === idx;
            const votantes = votantesPorOpcion.get(idx) || [];
            const nombresVotantes = votantes
                .map((pId) => PERSONAJES_INFO[pId]?.nombre || pId)
                .join(", ");
            const textoVotos = votantes.length > 0 ? `\n🗳️ Votos: ${nombresVotantes}` : "";

            const textoBaseFormateado = formatearTextoOpcionEvento(
                opcion,
                cartaId,
                reliquiaId,
                maldicionId,
                miJugador.hpMax
            );

            const prefijo = !validacionGrupo.valida
                ? `🔒 [BLOQUEADO: ${validacionGrupo.motivoBloqueo}] `
                : laVoteYo
                ? "✅ "
                : "";

            const lbl = nodo.getComponent(Label) || nodo.getComponentInChildren(Label);
            if (lbl) {
                lbl.string = `${prefijo}${textoBaseFormateado}${textoVotos}`;
                lbl.color = !validacionGrupo.valida
                    ? new Color(150, 150, 150)
                    : laVoteYo
                    ? new Color(130, 255, 150)
                    : new Color(255, 255, 255);
            }

            const btn = nodo.getComponent(Button);
            if (btn) btn.interactable = validacionGrupo.valida;
        });

        for (let i = evento.opciones.length; i < this.nodosOpciones.length; i++) {
            this.nodosOpciones[i].active = false;
        }

        const indicePreview =
            miJugador.eventoVotoOpcion >= 0
                ? miJugador.eventoVotoOpcion
                : state.opcionGanadoraEventoIdx;
        this.actualizarPrevisualizacion(miJugador, indicePreview);
    }

    private validarOpcionComunitariaEnGrupo(
        state: IEstadoSalaCliente,
        opcion: IOpcionEventoData
    ): { valida: boolean; motivoBloqueo?: string } {
        let resultadoFinal: { valida: boolean; motivoBloqueo?: string } = { valida: true };
        state.jugadores.forEach((j: IJugadorCliente) => {
            if (!resultadoFinal.valida) return;
            const res = validarRequisitosOpcionParaJugador(opcion, {
                hp: j.hp,
                hpMax: j.hpMax,
                oro: j.oro,
                mazoLength: j.mazoMaestro?.length || 0,
                mazoCartasIds: j.mazoMaestro
            });
            if (!res.valida) {
                resultadoFinal = {
                    valida: false,
                    motivoBloqueo: `${j.nombre}: ${res.motivoBloqueo}`
                };
            }
        });
        return resultadoFinal;
    }

    private asegurarCantidadBotones(cantidad: number) {
        if (!this.contenedorOpciones || !this.templateBotonOpcion) return;

        while (this.nodosOpciones.length < cantidad) {
            const idx = this.nodosOpciones.length;
            const nodo = instantiate(this.templateBotonOpcion);
            this.contenedorOpciones.addChild(nodo);
            if (!nodo.getComponent(Button)) nodo.addComponent(Button);
            nodo.on(
                Button.EventType.CLICK,
                () => this.onClickOpcion(idx),
                this
            );
            this.nodosOpciones.push(nodo);
        }
    }

    private onClickOpcion(indice: number) {
        const state = NetworkManager.instance?.room?.state;
        if (!state || state.faseActual !== "EVENT") return;

        const evento = CATALOGO_EVENTOS[state.eventoActualId];
        if (!evento) return;

        if (evento.modo === "COMUNITARIO") {
            NetworkManager.instance?.votarOpcionEvento(indice);
        } else {
            this.opcionSeleccionadaIdx =
                this.opcionSeleccionadaIdx === indice ? -1 : indice;
            this.onEstadoCambiado(state);
        }
    }

    private actualizarPrevisualizacion(miJugador: IJugadorCliente, idxOpcion: number) {
        if (!this.contenedorPrevisualizacion) return;

        if (idxOpcion < 0) {
            this.contenedorPrevisualizacion.active = false;
            return;
        }

        const cartaId = miJugador.eventoOpcionCartas?.[idxOpcion] || "";
        const reliquiaId = miJugador.eventoOpcionReliquias?.[idxOpcion] || "";
        const maldicionId = miJugador.eventoOpcionMaldiciones?.[idxOpcion] || "";

        const dataCarta = cartaId ? CATALOGO_CARTAS[cartaId] : undefined;
        const dataMaldicion = maldicionId ? CATALOGO_CARTAS[maldicionId] : undefined;
        const dataReliquia = reliquiaId ? CATALOGO_RELIQUIAS[reliquiaId] : undefined;

        const hayAlgoParaMostrar = Boolean(dataCarta || dataMaldicion || dataReliquia);
        this.contenedorPrevisualizacion.active = hayAlgoParaMostrar;
        if (!hayAlgoParaMostrar) return;

        if (this.cartaRecompensaPreview) {
            this.cartaRecompensaPreview.node.active = Boolean(dataCarta);
            if (dataCarta) {
                this.cartaRecompensaPreview.configurarModoEstatico(dataCarta, 0.9);
            }
        }

        if (this.cartaMaldicionPreview) {
            this.cartaMaldicionPreview.node.active = Boolean(dataMaldicion);
            if (dataMaldicion) {
                this.cartaMaldicionPreview.configurarModoEstatico(dataMaldicion, 0.9);
            }
        }

        if (this.nodoReliquiaPreview) {
            this.nodoReliquiaPreview.active = Boolean(dataReliquia);
            if (dataReliquia) {
                if (this.spriteReliquiaPreview) {
                    SpriteManager.aplicarSprite(
                        this.spriteReliquiaPreview,
                        "reliquias",
                        dataReliquia.icono
                    );
                }
                if (this.labelReliquiaPreview) {
                    this.labelReliquiaPreview.string = `${dataReliquia.nombre}\n${dataReliquia.descripcion}`;
                }
            }
        }
    }

    public onClickContinuarIndividual() {
        const state = NetworkManager.instance?.room?.state;
        if (!state || state.faseActual !== "EVENT") return;

        const evento = CATALOGO_EVENTOS[state.eventoActualId];
        if (!evento || evento.modo !== "INDIVIDUAL") return;
        if (this.opcionSeleccionadaIdx < 0 || this.opcionSeleccionadaIdx >= evento.opciones.length) return;

        const opcionElegida = evento.opciones[this.opcionSeleccionadaIdx];
        if (opcionRequiereElegirCartaMazo(opcionElegida)) {
            const idxOpcionGuardar = this.opcionSeleccionadaIdx;
            this.visorMazo?.abrirModoEliminar(
                (indiceMazo) => {
                    NetworkManager.instance?.enviarAccionEvento(idxOpcionGuardar, indiceMazo);
                },
                () => {}
            );
        } else {
            NetworkManager.instance?.enviarAccionEvento(this.opcionSeleccionadaIdx);
        }
    }
}