import { _decorator, Component, Node, Label, Prefab, instantiate, UITransform, Graphics, ScrollView, Vec3, Color } from "cc";
import { NetworkManager, NetworkEvents, EVENTO_ESTADO_ACTUALIZADO } from "../network/NetworkManager";
import { CONFIG_MAPA, obtenerCantidadPisosMapa } from "../../compartido/Mapa";
import { NOMBRES_AMBIENTACION } from "../../compartido/Enemigos";
import { IEstadoSalaCliente, INodoMapaCliente, IJugadorCliente, PersonajeId } from "../../compartido/GameTypes";
import { MapNodeView } from "./MapNodeView";

const { ccclass, property } = _decorator;

@ccclass("MapController")
export class MapController extends Component {
    @property(Label) labelEstadoVotacion: Label = null!;
    @property(ScrollView) scrollViewMapa: ScrollView = null!;
    @property(Node) contentScroll: Node = null!;
    @property(Graphics) graphicsLineas: Graphics = null!;
    @property(Node) contenedorNodos: Node = null!;
    @property(Prefab) prefabNodoMapa: Prefab = null!;
    @property(Node) btnCerrarConsulta: Node = null!;

    private readonly ESPACIO_ENTRE_PISOS = 150;
    private readonly ESPACIO_ENTRE_COLUMNAS = 130;
    private readonly MARGEN_VERTICAL = 120;

    private nodosInstanciados: Map<string, Node> = new Map();
    private posicionesPorId: Map<string, Vec3> = new Map();
    private ultimaFirmaGrafo: string = "";

    onEnable() {
        this.ultimaFirmaGrafo = "";
        NetworkEvents.on(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoCambiado, this);
        if (NetworkManager.instance?.room?.state) {
            this.onEstadoCambiado(NetworkManager.instance.room.state);
        }
    }

    onDisable() {
        NetworkEvents.off(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoCambiado, this);
    }

    private onEstadoCambiado(state: IEstadoSalaCliente) {
        if (!state.nodosMapa || state.nodosMapa.length === 0) return;

        const enFaseMapa = state.faseActual === "MAP";
        if (this.btnCerrarConsulta) {
            this.btnCerrarConsulta.active = !enFaseMapa;
        }

        this.actualizarTextoCabecera(state, enFaseMapa);

        const nuevaFirma = this.calcularFirmaGrafo(state, enFaseMapa);
        if (nuevaFirma === this.ultimaFirmaGrafo) return;
        this.ultimaFirmaGrafo = nuevaFirma;

        this.renderizarGrafo(state, enFaseMapa);
    }

    private calcularFirmaGrafo(state: IEstadoSalaCliente, enFaseMapa: boolean): string {
        const partes: string[] = [
            `${enFaseMapa}`,
            `${state.mapaActual || 1}`,
            `${state.ambientacionActual || ""}`,
            state.nodoActualId,
            state.nodoGanadorMapaId
        ];
        state.nodosMapa.forEach((n: INodoMapaCliente) => {
            partes.push(`${n.id}:${n.estado}:${n.tipo}`);
        });
        state.jugadores.forEach((j: IJugadorCliente) => {
            partes.push(`${j.sessionId}:${j.nodoVotadoId}:${j.personajeId}`);
        });
        return partes.join("|");
    }

    private actualizarTextoCabecera(state: IEstadoSalaCliente, enFaseMapa: boolean) {
        if (!this.labelEstadoVotacion) return;

        const numMapa = state.mapaActual || 1;
        const totalMapas = CONFIG_MAPA.TOTAL_MAPAS || 3;
        const mundoTxt = NOMBRES_AMBIENTACION[state.ambientacionActual] || state.ambientacionActual || "";
        const infoMapa = `Mapa ${numMapa}/${totalMapas} (${mundoTxt})`;

        if (!enFaseMapa) {
            this.labelEstadoVotacion.string = `${infoMapa} (Modo Consulta) — Piso Actual: ${state.pisoActual}`;
            return;
        }

        if (state.hayEmpateMapa) {
            this.labelEstadoVotacion.string = `${infoMapa} — ⚖️ ¡EMPATE EN LA VOTACIÓN! Dialoguen y cambien su voto`;
            return;
        }

        if (state.tiempoCuentaRegresivaMapa > 0) {
            this.labelEstadoVotacion.string = `${infoMapa} — 🚀 Rumbo elegido — Iniciando en ${state.tiempoCuentaRegresivaMapa}s... (podés cambiar tu voto)`;
            return;
        }

        let votaron = 0;
        let total = 0;
        state.jugadores.forEach((j: IJugadorCliente) => {
            total++;
            if (j.nodoVotadoId) votaron++;
        });

        this.labelEstadoVotacion.string = `🗺️ ${infoMapa} — Voten el próximo destino (${votaron}/${total} votos)`;
    }

    private renderizarGrafo(state: IEstadoSalaCliente, enFaseMapa: boolean) {
        if (!this.contentScroll || !this.contenedorNodos || !this.prefabNodoMapa) return;

        const totalPisos = obtenerCantidadPisosMapa(state.mapaActual || 1);
        const altoTotal = totalPisos * this.ESPACIO_ENTRE_PISOS + this.MARGEN_VERTICAL * 2;

        const uiContent = this.contentScroll.getComponent(UITransform);
        if (uiContent) {
            uiContent.setContentSize(uiContent.width, Math.max(600, altoTotal));
        }

        const votosPorNodo: Map<string, PersonajeId[]> = new Map();
        state.jugadores.forEach((j: IJugadorCliente) => {
            if (j.nodoVotadoId) {
                const lista = votosPorNodo.get(j.nodoVotadoId) || [];
                lista.push(j.personajeId);
                votosPorNodo.set(j.nodoVotadoId, lista);
            }
        });

        this.posicionesPorId.clear();
        const idsPresentes = new Set<string>();

        state.nodosMapa.forEach((nodoSchema: INodoMapaCliente) => {
            idsPresentes.add(nodoSchema.id);

            let nodoVisual = this.nodosInstanciados.get(nodoSchema.id);
            if (!nodoVisual) {
                nodoVisual = instantiate(this.prefabNodoMapa);
                this.contenedorNodos.addChild(nodoVisual);
                this.nodosInstanciados.set(nodoSchema.id, nodoVisual);
            }
            nodoVisual.active = true;

            const colCentrada = nodoSchema.columna - (CONFIG_MAPA.COLUMNAS - 1) / 2;
            const x = colCentrada * this.ESPACIO_ENTRE_COLUMNAS;
            const y = this.MARGEN_VERTICAL + (nodoSchema.piso - 1) * this.ESPACIO_ENTRE_PISOS;

            const pos = new Vec3(x, y, 0);
            nodoVisual.setPosition(pos);
            this.posicionesPorId.set(nodoSchema.id, pos);

            const view = nodoVisual.getComponent(MapNodeView);
            const votantes = votosPorNodo.get(nodoSchema.id) || [];
            const esVotable = enFaseMapa && nodoSchema.estado === "DISPONIBLE";
            const esGanador = enFaseMapa && state.nodoGanadorMapaId === nodoSchema.id;

            view?.configurar(
                nodoSchema,
                votantes,
                esVotable,
                esGanador,
                (idElegido) => NetworkManager.instance?.votarNodoMapa(idElegido)
            );
        });

        this.nodosInstanciados.forEach((nodo, id) => {
            if (!idsPresentes.has(id)) nodo.active = false;
        });

        this.dibujarLineasConexion(state.nodosMapa);
    }

    private dibujarLineasConexion(nodosMapa: IEstadoSalaCliente["nodosMapa"]) {
        if (!this.graphicsLineas) return;

        this.graphicsLineas.clear();
        this.graphicsLineas.lineWidth = 5;
        this.graphicsLineas.strokeColor = new Color(180, 180, 195, 180);

        nodosMapa.forEach((nodoOrigen: INodoMapaCliente) => {
            const posOrigen = this.posicionesPorId.get(nodoOrigen.id);
            if (!posOrigen || !nodoOrigen.siguientesIds) return;

            for (const idDestino of nodoOrigen.siguientesIds) {
                const posDestino = this.posicionesPorId.get(idDestino);
                if (!posDestino) continue;

                this.graphicsLineas.moveTo(posOrigen.x, posOrigen.y);
                this.graphicsLineas.lineTo(posDestino.x, posDestino.y);
            }
        });

        this.graphicsLineas.stroke();
    }

    public centrarEnPisoActual(pisoActual: number) {
        if (!this.scrollViewMapa) return;
        const numMapa = NetworkManager.instance?.room?.state?.mapaActual || 1;
        const totalPisos = Math.max(2, obtenerCantidadPisosMapa(numMapa));
        const progresoDesdeAbajo = (pisoActual - 1) / (totalPisos - 1);
        this.scrollViewMapa.scrollToPercentVertical(progresoDesdeAbajo, 0.25);
    }
}