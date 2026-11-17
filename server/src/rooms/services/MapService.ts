import { Clock, Delayed } from "colyseus";
import { SpireState, MapNodeState } from "../schema/SpireState";
import { CONFIG_MAPA, generarMapaRun, TipoNodoMapa } from "../../../../assets/cliente/compartido/Mapa";

export class MapService {
    private timerMapa: Delayed | null = null;

    constructor(
        private state: SpireState,
        private clock: Clock,
        private onViajarANodoCallback: (tipo: TipoNodoMapa) => void
    ) {}

    public inicializarMapaNuevaRun(): void {
        this.state.nodosMapa.clear();
        this.state.nodoActualId = "";
        this.state.pisoActual = 1;

        const datosMapa = generarMapaRun();
        for (const d of datosMapa) {
            const nodoSchema = new MapNodeState();
            nodoSchema.id = d.id;
            nodoSchema.piso = d.piso;
            nodoSchema.columna = d.columna;
            nodoSchema.tipo = d.tipo;
            nodoSchema.estado = d.estado;
            d.siguientesIds.forEach((sigId) => nodoSchema.siguientesIds.push(sigId));
            this.state.nodosMapa.push(nodoSchema);
        }

        this.abrirFaseMapa();
    }

    public abrirFaseMapa(): void {
        this.cancelarCuentaRegresiva();
        this.state.jugadores.forEach((j) => {
            j.nodoVotadoId = "";
        });
        this.state.faseActual = "MAP";
    }

    public registrarVoto(sessionId: string, nodoId: string): void {
        if (this.state.faseActual !== "MAP") return;
        const jugador = this.state.jugadores.get(sessionId);
        if (!jugador) return;

        const nodo = this.state.nodosMapa.find((n) => n.id === nodoId);
        if (!nodo || nodo.estado !== "DISPONIBLE") return;

        jugador.nodoVotadoId = nodo.id;
        this.evaluarVotos();
    }

    public evaluarVotos(): void {
        const totalJugadores = this.state.jugadores.size;
        if (totalJugadores === 0) return;

        let votosEmitidos = 0;
        const conteo: Map<string, number> = new Map();

        this.state.jugadores.forEach((j) => {
            if (j.nodoVotadoId) {
                votosEmitidos++;
                conteo.set(j.nodoVotadoId, (conteo.get(j.nodoVotadoId) || 0) + 1);
            }
        });

        if (votosEmitidos < totalJugadores) {
            this.cancelarCuentaRegresiva();
            return;
        }

        let maxVotos = 0;
        let candidatosGanadores: string[] = [];

        conteo.forEach((cantidad, nodoId) => {
            if (cantidad > maxVotos) {
                maxVotos = cantidad;
                candidatosGanadores = [nodoId];
            } else if (cantidad === maxVotos) {
                candidatosGanadores.push(nodoId);
            }
        });

        if (candidatosGanadores.length !== 1) {
            this.cancelarCuentaRegresiva();
            this.state.hayEmpateMapa = true;
            return;
        }

        const ganadorId = candidatosGanadores[0];
        this.state.hayEmpateMapa = false;

        if (this.timerMapa && this.state.nodoGanadorMapaId === ganadorId) {
            return;
        }

        this.iniciarCuentaRegresiva(ganadorId);
    }

    public desbloquearSiguientesNodos(): void {
        const nodoActual = this.state.nodosMapa.find((n) => n.id === this.state.nodoActualId);
        if (!nodoActual) return;

        nodoActual.estado = "COMPLETADO";
        const siguientes = new Set<string>(Array.from(nodoActual.siguientesIds));

        this.state.nodosMapa.forEach((n) => {
            if (siguientes.has(n.id)) {
                n.estado = "DISPONIBLE";
            }
        });
    }

    public cancelarCuentaRegresiva(): void {
        if (this.timerMapa) {
            this.timerMapa.clear();
            this.timerMapa = null;
        }
        this.state.tiempoCuentaRegresivaMapa = 0;
        this.state.nodoGanadorMapaId = "";
        this.state.hayEmpateMapa = false;
    }

    private iniciarCuentaRegresiva(ganadorId: string): void {
        this.cancelarCuentaRegresiva();
        this.state.nodoGanadorMapaId = ganadorId;
        this.state.tiempoCuentaRegresivaMapa = CONFIG_MAPA.SEGUNDOS_CUENTA_REGRESIVA;

        this.timerMapa = this.clock.setInterval(() => {
            this.state.tiempoCuentaRegresivaMapa -= 1;
            if (this.state.tiempoCuentaRegresivaMapa <= 0) {
                const destinoId = this.state.nodoGanadorMapaId;
                this.cancelarCuentaRegresiva();
                this.viajarANodo(destinoId);
            }
        }, 1000);
    }

    private viajarANodo(nodoId: string): void {
        const nodoElegido = this.state.nodosMapa.find((n) => n.id === nodoId);
        if (!nodoElegido) return;

        this.state.nodosMapa.forEach((n) => {
            if (n.estado === "ACTUAL") n.estado = "COMPLETADO";
            else if (n.estado === "DISPONIBLE" && n.id !== nodoElegido.id) n.estado = "BLOQUEADO";
        });

        nodoElegido.estado = "ACTUAL";
        this.state.nodoActualId = nodoElegido.id;
        this.state.pisoActual = nodoElegido.piso;
        this.state.jugadores.forEach((j) => {
            j.nodoVotadoId = "";
        });

        this.onViajarANodoCallback(nodoElegido.tipo as TipoNodoMapa);
    }
}