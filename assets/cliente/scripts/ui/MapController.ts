import { _decorator, Component, Node, Label, Prefab, instantiate, UITransform, Graphics, ScrollView, Vec3, Color, Vec2 } from "cc";
import { NetworkManager, NetworkEvents, EVENTO_ESTADO_ACTUALIZADO } from "../network/NetworkManager";
import { CONFIG_MAPA } from "../../compartido/Mapa";
import { PersonajeId } from "../../compartido/GameTypes";
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

    // Espaciado visual configurable
    private readonly ESPACIO_ENTRE_PISOS = 150;
    private readonly ESPACIO_ENTRE_COLUMNAS = 130;
    private readonly MARGEN_VERTICAL = 120;

    private nodosInstanciados: Map<string, Node> = new Map();
    private posicionesPorId: Map<string, Vec3> = new Map();

    onEnable() {
        NetworkEvents.on(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoCambiado, this);
        if (NetworkManager.instance?.room?.state) {
            this.onEstadoCambiado(NetworkManager.instance.room.state);
        }
    }

    onDisable() {
        NetworkEvents.off(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoCambiado, this);
    }

    private onEstadoCambiado(state: any) {
        if (!state.nodosMapa || state.nodosMapa.length === 0) return;

        const enFaseMapa = state.faseActual === "MAP";
        if (this.btnCerrarConsulta) {
            // El botón de cerrar solo aparece cuando se consulta el mapa durante COMBAT o REWARD
            this.btnCerrarConsulta.active = !enFaseMapa;
        }

        this.actualizarTextoCabecera(state, enFaseMapa);
        this.renderizarGrafo(state, enFaseMapa);
    }

    private actualizarTextoCabecera(state: any, enFaseMapa: boolean) {
        if (!this.labelEstadoVotacion) return;

        if (!enFaseMapa) {
            this.labelEstadoVotacion.string = `Mapa (Modo Consulta) — Piso Actual: ${state.pisoActual}`;
            return;
        }

        if (state.hayEmpateMapa) {
            this.labelEstadoVotacion.string = "⚖️ ¡EMPATE EN LA VOTACIÓN! Dialoguen y cambien su voto";
            return;
        }

        if (state.tiempoCuentaRegresivaMapa > 0) {
            this.labelEstadoVotacion.string = `🚀 Rumbo elegido — Iniciando en ${state.tiempoCuentaRegresivaMapa}s... (podés cambiar tu voto)`;
            return;
        }

        let votaron = 0;
        let total = 0;
        state.jugadores.forEach((j: any) => {
            total++;
            if (j.nodoVotadoId) votaron++;
        });

        this.labelEstadoVotacion.string = `🗺️ Voten el próximo destino (${votaron}/${total} votos)`;
    }

    private renderizarGrafo(state: any, enFaseMapa: boolean) {
        if (!this.contentScroll || !this.contenedorNodos || !this.prefabNodoMapa) return;

        const totalPisos = CONFIG_MAPA.CANTIDAD_PISOS;
        const altoTotal = totalPisos * this.ESPACIO_ENTRE_PISOS + this.MARGEN_VERTICAL * 2;

        // Ajustar el alto del Content del ScrollView dinámicamente (con Anchor Y = 0 en contentScroll)
        const uiContent = this.contentScroll.getComponent(UITransform);
        if (uiContent) {
            uiContent.setContentSize(uiContent.width, Math.max(600, altoTotal));
        }

        // Agrupar qué personajes votaron por cada nodo
        const votosPorNodo: Map<string, PersonajeId[]> = new Map();
        state.jugadores.forEach((j: any) => {
            if (j.nodoVotadoId) {
                const lista = votosPorNodo.get(j.nodoVotadoId) || [];
                lista.push(j.personajeId as PersonajeId);
                votosPorNodo.set(j.nodoVotadoId, lista);
            }
        });

        this.posicionesPorId.clear();
        const idsPresentes = new Set<string>();

        // 1. Posicionar y configurar cada nodo (Piso 1 abajo, Jefe arriba)
        state.nodosMapa.forEach((nodoSchema: any) => {
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

        // Ocultar nodos viejos si se reinició la run
        this.nodosInstanciados.forEach((nodo, id) => {
            if (!idsPresentes.has(id)) nodo.active = false;
        });

        // 2. Dibujar las líneas de conexión entre pisos
        this.dibujarLineasConexion(state.nodosMapa);
    }

    private dibujarLineasConexion(nodosMapa: any) {
        if (!this.graphicsLineas) return;

        this.graphicsLineas.clear();
        this.graphicsLineas.lineWidth = 5;
        this.graphicsLineas.strokeColor = new Color(180, 180, 195, 180);

        nodosMapa.forEach((nodoOrigen: any) => {
            const posOrigen = this.posicionesPorId.get(nodoOrigen.id);
            if (!posOrigen || !nodoOrigen.siguientesIds) return;

            nodoOrigen.siguientesIds.forEach((idDestino: string) => {
                const posDestino = this.posicionesPorId.get(idDestino);
                if (!posDestino) return;

                this.graphicsLineas.moveTo(posOrigen.x, posOrigen.y);
                this.graphicsLineas.lineTo(posDestino.x, posDestino.y);
            });
        });

        this.graphicsLineas.stroke();
    }

    public centrarEnPisoActual(pisoActual: number) {
        if (!this.scrollViewMapa) return;
        const totalPisos = Math.max(2, CONFIG_MAPA.CANTIDAD_PISOS);
        // En ScrollView de Cocos: 0 = arriba del todo, 1 = abajo del todo
        const progresoDesdeAbajo = (pisoActual - 1) / (totalPisos - 1);
        this.scrollViewMapa.scrollToPercentVertical(progresoDesdeAbajo, 0.25);
    }
}