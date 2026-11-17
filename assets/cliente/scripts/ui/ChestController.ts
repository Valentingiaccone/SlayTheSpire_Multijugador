import { _decorator, Component, Node, Label, Button, Sprite, instantiate, Color } from "cc";
import { NetworkManager, NetworkEvents, EVENTO_ESTADO_ACTUALIZADO } from "../network/NetworkManager";
import { CATALOGO_RELIQUIAS } from "../../compartido/Reliquias";
import {
    PERSONAJES_INFO,
    PersonajeId,
    IEstadoSalaCliente,
    IJugadorCliente
} from "../../compartido/GameTypes";
import { SpriteManager } from "../utils/SpriteManager";

const { ccclass, property } = _decorator;

@ccclass("ChestController")
export class ChestController extends Component {
    @property(Label) labelEstadoCofre: Label = null!;
    @property(Node) nodoCofreCerrado: Node = null!;
    @property(Node) contenedorReliquias: Node = null!;
    @property(Node) templateItemReliquia: Node = null!;

    private nodosItems: Node[] = [];
    private idsReliquiaPorIndice: string[] = [];

    onLoad() {
        if (this.templateItemReliquia) this.templateItemReliquia.active = false;
    }

    onEnable() {
        NetworkEvents.on(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoCambiado, this);
        if (NetworkManager.instance?.room?.state) {
            this.onEstadoCambiado(NetworkManager.instance.room.state);
        }
    }

    onDisable() {
        NetworkEvents.off(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoCambiado, this);
    }

    private onEstadoCambiado(state: IEstadoSalaCliente) {
        if (state.faseActual !== "CHEST") return;

        if (!state.cofreAbierto) {
            if (this.nodoCofreCerrado) this.nodoCofreCerrado.active = true;
            if (this.contenedorReliquias) this.contenedorReliquias.active = false;
            if (this.labelEstadoCofre) {
                this.labelEstadoCofre.string =
                    "📦 ¡Encontraron un Cofre! Cualquier jugador puede tocarlo para abrirlo";
            }
            return;
        }

        if (this.nodoCofreCerrado) this.nodoCofreCerrado.active = false;
        if (this.contenedorReliquias) this.contenedorReliquias.active = true;

        this.actualizarTextoEstado(state);
        this.renderizarReliquiasCofre(state);
    }

    private actualizarTextoEstado(state: IEstadoSalaCliente) {
        if (!this.labelEstadoCofre) return;

        if (state.hayConflictoCofre) {
            this.labelEstadoCofre.string =
                "⚠️ ¡Dos jugadores eligieron la misma reliquia! Cada uno debe elegir una diferente";
            return;
        }

        if (state.tiempoCuentaRegresivaCofre > 0) {
            this.labelEstadoCofre.string = `✨ ¡Reliquias asignadas! Avanzando en ${state.tiempoCuentaRegresivaCofre}s...`;
            return;
        }

        let listos = 0;
        let total = 0;
        state.jugadores.forEach((j: IJugadorCliente) => {
            total++;
            if (j.reliquiaCofreVotadaId) listos++;
        });
        this.labelEstadoCofre.string = `💎 Elegí una reliquia distinta a la de tus aliados (${listos}/${total})`;
    }

    private renderizarReliquiasCofre(state: IEstadoSalaCliente) {
        if (!this.contenedorReliquias || !this.templateItemReliquia) return;

        const listaIds: string[] = Array.from(state.reliquiasCofre || []);
        while (this.nodosItems.length < listaIds.length) {
            const idx = this.nodosItems.length;
            const n = instantiate(this.templateItemReliquia);
            this.contenedorReliquias.addChild(n);
            n.on(
                Button.EventType.CLICK,
                () => {
                    const idElegido = this.idsReliquiaPorIndice[idx];
                    if (idElegido) {
                        NetworkManager.instance?.votarReliquiaCofre(idElegido);
                    }
                },
                this
            );
            this.nodosItems.push(n);
        }

        const votantesPorReliquia: Map<string, PersonajeId[]> = new Map();
        state.jugadores.forEach((j: IJugadorCliente) => {
            if (j.reliquiaCofreVotadaId) {
                const arr = votantesPorReliquia.get(j.reliquiaCofreVotadaId) || [];
                arr.push(j.personajeId);
                votantesPorReliquia.set(j.reliquiaCofreVotadaId, arr);
            }
        });

        const miId = NetworkManager.instance?.room?.sessionId;
        const miJugador = miId ? state.jugadores.get(miId) : undefined;

        this.nodosItems.forEach((nodo, i) => {
            if (i >= listaIds.length) {
                nodo.active = false;
                this.idsReliquiaPorIndice[i] = "";
                return;
            }

            const reliquiaId = listaIds[i];
            this.idsReliquiaPorIndice[i] = reliquiaId;

            const data = CATALOGO_RELIQUIAS[reliquiaId];
            if (!data) {
                nodo.active = false;
                return;
            }

            nodo.active = true;
            const votantes = votantesPorReliquia.get(reliquiaId) || [];
            const laVoteYo = miJugador?.reliquiaCofreVotadaId === reliquiaId;

            const label = nodo.getComponentInChildren(Label);
            if (label) {
                const nombresVotantes = votantes
                    .map((pId) => PERSONAJES_INFO[pId]?.nombre || pId)
                    .join(", ");
                const txtVotos = votantes.length > 0 ? `\n👤 Elegida por: ${nombresVotantes}` : "";
                label.string = `${data.nombre}\n${data.descripcion}${txtVotos}`;
                label.color =
                    votantes.length > 1
                        ? new Color(255, 110, 110)
                        : laVoteYo
                        ? new Color(130, 255, 150)
                        : new Color(255, 255, 255);
            }

            const sprite = nodo.getComponentInChildren(Sprite);
            if (sprite) {
                SpriteManager.aplicarSprite(sprite, "reliquias", data.icono);
            }
        });
    }

    public onClickAbrirCofre() {
        NetworkManager.instance?.abrirCofre();
    }
}