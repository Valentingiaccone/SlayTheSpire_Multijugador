import { _decorator, Component, Node, Label, Button, Sprite, Color, UITransform } from "cc";
import { PERSONAJES_INFO, PersonajeId } from "../../compartido/GameTypes";
import { EstadoNodoMapa, TipoNodoMapa } from "../../compartido/Mapa";
import { SpriteManager } from "../utils/SpriteManager";

const { ccclass, property } = _decorator;

@ccclass("MapNodeView")
export class MapNodeView extends Component {
    @property(Label) labelTipo: Label = null!;
    @property(Sprite) spriteFondo: Sprite = null!;
    @property(Button) boton: Button = null!;
    @property(Node) contenedorVotos: Node = null!;

    private nodoId: string = "";
    private onClickCallback: ((nodoId: string) => void) | null = null;
    private nodosIconosVoto: Node[] = [];

    onLoad() {
        this.node.on(Button.EventType.CLICK, () => {
            this.onClickCallback?.(this.nodoId);
        });
    }

    public configurar(
        nodoSchema: any,
        personajesQueVotaron: PersonajeId[],
        esVotable: boolean,
        esGanadorActual: boolean,
        onClick: (nodoId: string) => void
    ) {
        this.nodoId = nodoSchema.id;
        this.onClickCallback = onClick;

        const tipo: TipoNodoMapa = nodoSchema.tipo;
        const estado: EstadoNodoMapa = nodoSchema.estado;

        if (this.labelTipo) {
            const iconos: Record<string, string> = {
                COMBATE: "⚔️",
                ELITE: "👹",
                COFRE: "📦",
                JEFE: "💀 JEFE"
            };
            this.labelTipo.string = iconos[tipo] || "❓";
        }

        if (this.boton) {
            this.boton.interactable = esVotable;
        }

        if (this.spriteFondo) {
            if (esGanadorActual) {
                this.spriteFondo.color = new Color(100, 255, 140); // Verde brillante si va ganando la votación
            } else if (estado === "DISPONIBLE") {
                this.spriteFondo.color = new Color(255, 230, 120); // Amarillo: disponible para votar
            } else if (estado === "ACTUAL") {
                this.spriteFondo.color = new Color(100, 200, 255); // Celeste: posición actual del grupo
            } else if (estado === "COMPLETADO") {
                this.spriteFondo.color = new Color(110, 110, 110); // Gris oscuro: ya superado
            } else {
                this.spriteFondo.color = new Color(65, 65, 75);    // Bloqueado
            }
        }

        this.renderizarIconosVotos(personajesQueVotaron);
    }

    private renderizarIconosVotos(personajes: PersonajeId[]) {
        if (!this.contenedorVotos) return;

        while (this.nodosIconosVoto.length < personajes.length) {
            const iconoNode = new Node("IconoVoto");
            const uiTrans = iconoNode.addComponent(UITransform);
            uiTrans.setContentSize(32, 32);
            const sp = iconoNode.addComponent(Sprite);
            sp.sizeMode = Sprite.SizeMode.CUSTOM;
            this.contenedorVotos.addChild(iconoNode);
            this.nodosIconosVoto.push(iconoNode);
        }

        this.nodosIconosVoto.forEach((nodoIcono, i) => {
            if (i >= personajes.length) {
                nodoIcono.active = false;
                return;
            }
            nodoIcono.active = true;
            // Separa los íconos horizontalmente encima del nodo
            const offset = (i - (personajes.length - 1) / 2) * 36;
            nodoIcono.setPosition(offset, 0, 0);

            const pjId = personajes[i];
            const infoPj = PERSONAJES_INFO[pjId];
            const spriteComp = nodoIcono.getComponent(Sprite);
            if (infoPj && infoPj.icono && spriteComp) {
                SpriteManager.aplicarSprite(spriteComp, "iconos", infoPj.icono);
            }
        });
    }
}