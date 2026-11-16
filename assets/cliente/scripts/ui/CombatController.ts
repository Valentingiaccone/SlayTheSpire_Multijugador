import { _decorator, Component, Node, Label, Button, Color, instantiate, UITransform, Vec2, Vec3, Prefab } from "cc";
import { NetworkManager, NetworkEvents, EVENTO_ESTADO_ACTUALIZADO } from "../network/NetworkManager";
import { CATALOGO_CARTAS } from "../../compartido/Cartas";
import { CardView } from "./CardView";

const { ccclass, property } = _decorator;

@ccclass("CombatController")
export class CombatController extends Component {
    @property(Label) labelTurno: Label = null!;

    @property(Node) contenedorEnemigos: Node = null!;
    @property(Node) templateEnemigo: Node = null!;

    @property(Node) contenedorAliados: Node = null!;
    @property(Node) templateAliado: Node = null!;

    @property(Node) contenedorMano: Node = null!;
    @property(Prefab) templateCarta: Prefab = null

    @property(Button) btnTerminarTurno: Button = null!;
    @property(Label) labelBtnTerminarTurno: Label = null!;

    private nodosEnemigos: Node[] = [];
    private nodosAliados: Node[] = [];
    private nodosCartas: Node[] = [];

    // Tablas paralelas para saber qué ID de servidor tiene cada nodo visual
    private uidsEnemigosPorNodo: string[] = [];
    private idsAliadosPorNodo: string[] = [];

    onLoad() {
        if (this.templateEnemigo) this.templateEnemigo.active = false;
        if (this.templateAliado) this.templateAliado.active = false;
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

    private onEstadoCambiado(state: any) {
        if (state.faseActual !== "COMBAT" && state.faseActual !== "DEFEAT") return;

        if (this.labelTurno) {
            this.labelTurno.string = state.faseActual === "DEFEAT"
                ? "¡DERROTA! Todos cayeron"
                : `Piso ${state.pisoActual}  —  Turno ${state.turnoNumero}`;
        }

        this.renderizarEnemigos(state.enemigos);
        this.renderizarAliados(state.jugadores);
    }

    private renderizarEnemigos(enemigos: any) {
        if (!this.contenedorEnemigos || !this.templateEnemigo) return;

        while (this.nodosEnemigos.length < enemigos.length) {
            const nodo = instantiate(this.templateEnemigo);
            nodo.parent = this.contenedorEnemigos;
            this.nodosEnemigos.push(nodo);
        }

        this.nodosEnemigos.forEach((nodo, i) => {
            if (i >= enemigos.length) {
                nodo.active = false;
                return;
            }
            const enemigo = enemigos[i];
            // Guardamos el UID de este enemigo en la misma posición i que su nodo visual
            this.uidsEnemigosPorNodo[i] = enemigo.uid;

            // Si el enemigo ya murió, lo ocultamos
            if (enemigo.hp <= 0) {
                nodo.active = false;
                return;
            }

            nodo.active = true;
            const label = nodo.getComponent(Label);
            if (label) {
                const intencionTxt = enemigo.intencionTipo === "ATACAR"
                    ? `⚔️ Ataca por ${enemigo.intencionValor} (a TODOS)`
                    : `🛡️ Se cubrirá +${enemigo.intencionValor}`;
                const bloqueoTxt = enemigo.bloqueo > 0 ? ` (+${enemigo.bloqueo} 🛡️)` : "";
                const estadosTxt = this.formatearEstados(enemigo.estados);

                label.string = `${enemigo.nombre}${estadosTxt}\nHP: ${enemigo.hp}/${enemigo.hpMax}${bloqueoTxt}\n${intencionTxt}`;
            }
        });
    }

    private renderizarAliados(jugadores: any) {
        if (!this.contenedorAliados || !this.templateAliado) return;

        const listaJugadores: any[] = [];
        jugadores.forEach((j: any) => listaJugadores.push(j));

        while (this.nodosAliados.length < listaJugadores.length) {
            const nodo = instantiate(this.templateAliado);
            nodo.parent = this.contenedorAliados;
            this.nodosAliados.push(nodo);
        }

        const miId = NetworkManager.instance?.room?.sessionId;

        this.nodosAliados.forEach((nodo, i) => {
            if (i >= listaJugadores.length) {
                nodo.active = false;
                return;
            }
            const j = listaJugadores[i];
            // Guardamos el sessionId de este aliado en la misma posición i que su nodo visual
            this.idsAliadosPorNodo[i] = j.sessionId;
            nodo.active = true;

            const esYo = j.sessionId === miId;
            const label = nodo.getComponent(Label);
            if (label) {
                const tagYo = esYo ? " (Vos)" : "";
                const estadoTurno = j.hp <= 0 ? "[CAÍDO]" : (j.turnoTerminado ? "[Turno Listo]" : "[Jugando]");
                const estadosTxt = this.formatearEstados(j.estados);

                label.string = `${j.nombre}${tagYo}${estadosTxt} | HP: ${j.hp}/${j.hpMax} | 🛡️ ${j.bloqueo} | ⚡ ${j.energia}/${j.energiaMax} ${estadoTurno}`;
                label.color = j.turnoTerminado ? new Color(150, 255, 150) : new Color(255, 255, 255);
            }

            if (esYo) {
                if (this.btnTerminarTurno && this.labelBtnTerminarTurno) {
                    this.btnTerminarTurno.interactable = !j.turnoTerminado && j.hp > 0;
                    this.labelBtnTerminarTurno.string = j.turnoTerminado ? "Esperando aliados..." : "Terminar Turno";
                }
                // Dibujamos nuestra mano de cartas
                this.renderizarMano(j);
            }
        });
    }

    private renderizarMano(miJugador: any) {
        if (!this.contenedorMano || !this.templateCarta) return;

        while (this.nodosCartas.length < miJugador.mano.length) {
            const nodo = instantiate(this.templateCarta);
            this.contenedorMano.addChild(nodo)
            this.nodosCartas.push(nodo);
        }

        this.nodosCartas.forEach((nodo, i) => {
            if (i >= miJugador.mano.length) {
                nodo.active = false
                return
            }

            const cartaId: string = miJugador.mano[i];
            const data = CATALOGO_CARTAS[cartaId];
            console.log(CATALOGO_CARTAS)
            if (!data) {
                nodo.active = false;
                return;
            }

            nodo.active = true;
            const cardView = nodo.getComponent(CardView);
            const puedePagarse = !miJugador.turnoTerminado && miJugador.energia >= data.costo;

            cardView?.configurar(
                i,
                data,
                puedePagarse,
                (indice, objetivoId) => NetworkManager.instance?.jugarCarta(indice, objetivoId),
                (tipo, touchPos) => this.detectarObjetivoBajoCursor(tipo, touchPos)
            );
        });
    }

    private detectarObjetivoBajoCursor(tipo: "ENEMIGO" | "ALIADO", touchPos: Vec3): string | undefined {
        const listaNodos = tipo === "ENEMIGO" ? this.nodosEnemigos : this.nodosAliados;
        const listaIds = tipo === "ENEMIGO" ? this.uidsEnemigosPorNodo : this.idsAliadosPorNodo;

        for (let i = 0; i < listaNodos.length; i++) {
            const nodo = listaNodos[i];
            if (!nodo.active) continue;
            const uiTrans = nodo.getComponent(UITransform);
            if (uiTrans && uiTrans.getBoundingBoxToWorld().contains(new Vec2(touchPos.x, touchPos.y))) {
                return listaIds[i];
            }
        }
        return undefined;
    }

    private formatearEstados(estados: any): string {
        if (!estados) return "";
        const leer = (clave: string) => typeof estados.get === "function" ? (estados.get(clave) || 0) : (estados[clave] || 0);

        const lista: string[] = [];
        const fuerza = leer("FUERZA");
        const vuln = leer("VULNERABLE");
        const debil = leer("DEBIL");
        const espinas = leer("ESPINAS");

        if (fuerza !== 0) lista.push(`💪${fuerza > 0 ? "+" : ""}${fuerza}`);
        if (vuln > 0) lista.push(`💔Vuln(${vuln})`);
        if (debil > 0) lista.push(`📉Débil(${debil})`);
        if (espinas > 0) lista.push(`🌵Espinas(${espinas})`);

        return lista.length > 0 ? ` [${lista.join(" ")}]` : "";
    }

    // Asignar al Click Events del botón BtnTerminarTurno
    public onClickTerminarTurno() {
        NetworkManager.instance?.terminarTurno();
    }
}