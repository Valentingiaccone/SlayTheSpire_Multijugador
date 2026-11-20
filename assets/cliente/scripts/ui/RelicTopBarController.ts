import {
    _decorator,
    Component,
    Node,
    Label,
    Sprite,
    Button,
    UITransform,
    Vec3,
    tween,
    Color
} from "cc";
import {
    NetworkManager,
    NetworkEvents,
    EVENTO_ESTADO_ACTUALIZADO,
    EVENTO_SECUENCIA_COMBATE
} from "../network/NetworkManager";
import { IEstadoSalaCliente, EventoVisualCombate } from "../../compartido/GameTypes";
import { CATALOGO_RELIQUIAS, IReliquiaData } from "../../compartido/Reliquias";
import { SpriteManager } from "../utils/SpriteManager";

const { ccclass, property } = _decorator;

@ccclass("RelicTopBarController")
export class RelicTopBarController extends Component {
    @property(Node) contenedorIconos: Node = null!;
    @property(Label) labelOro: Label = null!;

    @property(Node) panelDetalle: Node = null!;
    @property(Sprite) spriteDetalle: Sprite = null!;
    @property(Label) labelNombreDetalle: Label = null!;
    @property(Label) labelDescripcionDetalle: Label = null!;

    private nodosIconos: Node[] = [];
    private labelsContadores: Label[] = [];
    private reliquiasActuales: string[] = [];
    private ultimaFirma: string = "";

    onLoad() {
        if (this.panelDetalle) this.panelDetalle.active = false;
    }

    onEnable() {
        this.ultimaFirma = "";
        NetworkEvents.on(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoCambiado, this);
        NetworkEvents.on(EVENTO_SECUENCIA_COMBATE, this.onSecuenciaCombate, this);
        if (NetworkManager.instance?.room?.state) {
            this.onEstadoCambiado(NetworkManager.instance.room.state);
        }
    }

    onDisable() {
        NetworkEvents.off(EVENTO_ESTADO_ACTUALIZADO, this.onEstadoCambiado, this);
        NetworkEvents.off(EVENTO_SECUENCIA_COMBATE, this.onSecuenciaCombate, this);
    }

    private onEstadoCambiado(state: IEstadoSalaCliente) {
        const miId = NetworkManager.instance?.room?.sessionId;
        const miJugador = miId ? state.jugadores.get(miId) : undefined;
        if (!miJugador) return;

        if (this.labelOro) {
            this.labelOro.string = `💰 ${miJugador.oro}`;
        }

        if (!this.contenedorIconos) return;

        const misReliquias: string[] = Array.from(miJugador.reliquias || []);
        const leerContador = (id: string): number | undefined => {
            const mapa = miJugador.contadoresReliquias;
            if (!mapa) return undefined;
            return typeof mapa.get === "function"
                ? mapa.get(id)
                : (mapa as unknown as Record<string, number>)[id];
        };

        const firmaContadores = misReliquias.map((r) => `${r}:${leerContador(r) ?? ""}`).join("|");
        const firma = `${state.faseActual}|${firmaContadores}`;
        if (firma === this.ultimaFirma) return;
        this.ultimaFirma = firma;
        this.reliquiasActuales = misReliquias;

        while (this.nodosIconos.length < misReliquias.length) {
            const idx = this.nodosIconos.length;
            const iconoNode = new Node("IconoReliquiaTopBar");
            const uiTrans = iconoNode.addComponent(UITransform);
            uiTrans.setContentSize(65, 65);

            const sp = iconoNode.addComponent(Sprite);
            sp.sizeMode = Sprite.SizeMode.CUSTOM;

            const nodoContador = new Node("LabelContador");
            nodoContador.setPosition(18, -18, 0);
            const lblCont = nodoContador.addComponent(Label);
            lblCont.fontSize = 20;
            lblCont.lineHeight = 22;
            lblCont.color = new Color(255, 240, 120);
            iconoNode.addChild(nodoContador);

            iconoNode.addComponent(Button);
            iconoNode.on(
                Button.EventType.CLICK,
                () => {
                    const relId = this.reliquiasActuales[idx];
                    const data = relId ? CATALOGO_RELIQUIAS[relId] : undefined;
                    if (data) this.mostrarDetalleReliquia(data);
                },
                this
            );

            this.contenedorIconos.addChild(iconoNode);
            this.nodosIconos.push(iconoNode);
            this.labelsContadores.push(lblCont);
        }

        const enCombate = state.faseActual === "COMBAT";

        this.nodosIconos.forEach((nodo, i) => {
            if (i >= misReliquias.length) {
                nodo.active = false;
                return;
            }

            const reliquiaId = misReliquias[i];
            const data = CATALOGO_RELIQUIAS[reliquiaId];
            if (!data) {
                nodo.active = false;
                return;
            }

            nodo.active = true;
            const sp = nodo.getComponent(Sprite);
            if (sp) {
                void SpriteManager.aplicarSprite(sp, "reliquias", data.icono, "generico");
            }

            const lblCont = this.labelsContadores[i];
            const cfg = data.contadorConfig;
            const valor = leerContador(reliquiaId);

            if (!cfg) {
                lblCont.node.active = false;
            } else if (cfg.modo === "CARGAS") {
                const v = valor ?? 0;
                lblCont.node.active = v > 0;
                lblCont.string = `${v}`;
            } else {
                const mostrar = enCombate && valor !== undefined && (cfg.modo === "ACUMULAR_CARTAS" || valor > 0);
                lblCont.node.active = mostrar;
                lblCont.string = `${valor ?? 0}`;
            }
        });
    }

    private onSecuenciaCombate(eventos: EventoVisualCombate[]) {
        const miId = NetworkManager.instance?.room?.sessionId;
        if (!miId || !eventos) return;

        eventos.forEach((ev) => {
            if (ev.tipo === "RELIQUIA_ACTIVADA" && ev.jugadorId === miId) {
                this.animarPulsoReliquia(ev.reliquiaId);
            }
        });
    }

    private animarPulsoReliquia(reliquiaId: string) {
        const idx = this.reliquiasActuales.indexOf(reliquiaId);
        if (idx === -1 || !this.nodosIconos[idx]) return;

        const nodo = this.nodosIconos[idx];
        tween(nodo)
            .to(0.12, { scale: new Vec3(1.35, 1.35, 1) })
            .to(0.15, { scale: new Vec3(1, 1, 1) })
            .start();
    }

    private mostrarDetalleReliquia(data: IReliquiaData) {
        if (!this.panelDetalle) return;
        this.panelDetalle.active = true;

        if (this.labelNombreDetalle) this.labelNombreDetalle.string = `${data.nombre} [${data.calidad}]`;
        if (this.labelDescripcionDetalle) this.labelDescripcionDetalle.string = data.descripcion;
        if (this.spriteDetalle) {
            void SpriteManager.aplicarSprite(this.spriteDetalle, "reliquias", data.icono, "generico");
        }
    }

    public onClickCerrarDetalle() {
        if (this.panelDetalle) this.panelDetalle.active = false;
    }
}