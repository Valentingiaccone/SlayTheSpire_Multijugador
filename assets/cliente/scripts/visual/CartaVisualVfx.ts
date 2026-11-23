import { _decorator, Component, Node, Label, Sprite, Color } from "cc";
import {
    esCartaGratisEsteTurno,
    obtenerDataCarta,
    obtenerEncantamientoCarta
} from "../../compartido/Cartas";
import { CATALOGO_ENCANTAMIENTOS } from "../../compartido/CondicionesYEfectos";
import {
    CalculadoraCombate,
    IContextoCalculoCarta,
    IMapaEstadosLectura
} from "../../compartido/CalculadoraCombate";
import { SpriteManager } from "../utils/SpriteManager";

const { ccclass, property } = _decorator;

export interface IContextoVisualCartaVfx {
    estadosLanzador?: IMapaEstadosLectura;
    contextoExtra?: IContextoCalculoCarta;
}

@ccclass("CartaVisualVfx")
export class CartaVisualVfx extends Component {
    @property({
        type: Node,
        tooltip: "Contenedor con los elementos del frente (fondo, arte, textos). Opcional."
    })
    nodoFrente: Node = null!;

    @property({
        type: Node,
        tooltip: "Nodo con el Sprite del dorso (carta_dorso). Si está vacío, se dibuja sobre 'imagen'."
    })
    nodoDorso: Node = null!;

    @property(Label) labelCosto: Label = null!;
    @property(Label) labelNombre: Label = null!;
    @property(Label) labelDescripcion: Label = null!;
    @property(Label) labelTipo: Label = null!;
    @property(Sprite) imagen: Sprite = null!;
    @property(Node) nodoEncantado: Node = null!;

    @property({
        tooltip: "Nombre del PNG en resources/cartas/ usado como dorso al mezclar el mazo."
    })
    nombreSpriteDorso: string = "carta_dorso";

    private ultimoSpriteFrente: string = "";
    private ultimoSpriteEncantamiento: string = "";
    private dorsoCargado: boolean = false;

    /** Dibuja el frente real de la carta (con mejoras, encantamientos y valores dinámicos) */
    public mostrarCarta(rawCartaId: string, contexto?: IContextoVisualCartaVfx): void {
        const data = obtenerDataCarta(rawCartaId);
        if (!data) {
            this.mostrarDorso();
            return;
        }

        if (this.nodoFrente) this.nodoFrente.active = true;
        if (this.nodoDorso) this.nodoDorso.active = false;
        this.alternarVisibilidadLabels(true);

        const encantamiento = obtenerEncantamientoCarta(rawCartaId);
        const gratisEsteTurno = esCartaGratisEsteTurno(rawCartaId);

        const costoMostrado = CalculadoraCombate.calcularCostoCarta(
            data.costo,
            data.reduccionCostoPorHpPerdido,
            contexto?.contextoExtra?.hpPerdidoCombate || 0,
            encantamiento,
            gratisEsteTurno
        );

        if (this.labelCosto) {
            this.labelCosto.string = data.injugable ? "-" : `${costoMostrado}`;
            this.labelCosto.color =
                costoMostrado < data.costo
                    ? new Color(130, 255, 140)
                    : new Color(255, 255, 255);
        }

        if (this.labelNombre) {
            this.labelNombre.string = data.nombre;
            if (data.tipo === "MALDICION") {
                this.labelNombre.color = new Color(215, 120, 255);
            } else if (data.esMejorada) {
                this.labelNombre.color = new Color(130, 255, 140);
            } else {
                this.labelNombre.color = new Color(255, 255, 255);
            }
        }

        if (this.labelTipo) {
            this.labelTipo.string = data.tipo;
        }

        if (this.labelDescripcion) {
            const res = CalculadoraCombate.formatearDescripcionCarta(
                data.descripcion,
                data.efectos,
                contexto?.estadosLanzador,
                undefined,
                contexto?.contextoExtra
            );
            this.labelDescripcion.string = res.texto;
            if (res.estadoDanio === "AUMENTADO" || res.estadoBloqueo === "AUMENTADO") {
                this.labelDescripcion.color = new Color(135, 255, 145);
            } else if (res.estadoDanio === "REDUCIDO" || res.estadoBloqueo === "REDUCIDO") {
                this.labelDescripcion.color = new Color(255, 130, 130);
            } else {
                this.labelDescripcion.color = new Color(255, 255, 255);
            }
        }

        if (this.imagen && this.ultimoSpriteFrente !== data.sprite) {
            this.ultimoSpriteFrente = data.sprite;
            void SpriteManager.aplicarSprite(this.imagen, "cartas", data.sprite);
        }

        if (this.nodoEncantado) {
            const infoEnc = encantamiento ? CATALOGO_ENCANTAMIENTOS[encantamiento] : undefined;
            if (infoEnc) {
                this.nodoEncantado.active = true;
                if (this.ultimoSpriteEncantamiento !== infoEnc.sprite) {
                    this.ultimoSpriteEncantamiento = infoEnc.sprite;
                    const spEnc =
                        this.nodoEncantado.getComponent(Sprite) ||
                        this.nodoEncantado.getComponentInChildren(Sprite);
                    if (spEnc) {
                        void SpriteManager.aplicarSprite(
                            spEnc,
                            "encantamientos",
                            infoEnc.sprite,
                            "generico"
                        );
                    }
                }
            } else {
                this.nodoEncantado.active = false;
            }
        }
    }

    /** Muestra la carta boca abajo usando el dorso (para el mezclado Descarte -> Robo) */
    public mostrarDorso(): void {
        if (this.nodoEncantado) this.nodoEncantado.active = false;

        if (this.nodoDorso) {
            if (this.nodoFrente) this.nodoFrente.active = false;
            else this.alternarVisibilidadLabels(false);

            this.nodoDorso.active = true;
            const spDorso =
                this.nodoDorso.getComponent(Sprite) ||
                this.nodoDorso.getComponentInChildren(Sprite);
            if (spDorso && !spDorso.spriteFrame && !this.dorsoCargado) {
                this.dorsoCargado = true;
                void SpriteManager.aplicarSprite(spDorso, "cartas", this.nombreSpriteDorso);
            }
            return;
        }

        // Si no configuraste un nodoDorso aparte, oculta los labels y pone carta_dorso en 'imagen'
        this.alternarVisibilidadLabels(false);
        if (this.imagen && this.ultimoSpriteFrente !== this.nombreSpriteDorso) {
            this.ultimoSpriteFrente = this.nombreSpriteDorso;
            void SpriteManager.aplicarSprite(this.imagen, "cartas", this.nombreSpriteDorso);
        }
    }

    private alternarVisibilidadLabels(activo: boolean): void {
        if (this.labelCosto) this.labelCosto.node.active = activo;
        if (this.labelNombre) this.labelNombre.node.active = activo;
        if (this.labelDescripcion) this.labelDescripcion.node.active = activo;
        if (this.labelTipo) this.labelTipo.node.active = activo;
    }
}