import { Room, Client } from "colyseus";
import { SpireState, PlayerState, EnemyState } from "./schema/SpireState";
import { MENSAJES, PersonajeId, PERSONAJES_INFO } from "../../../assets/cliente/compartido/GameTypes";
import { ENEMIGOS_INFO, ENCUENTROS_POR_PISO } from "../../../assets/cliente/compartido/Enemigos";
import { generarOpcionesRecompensa, obtenerMazoInicial } from "../../../assets/cliente/compartido/Cartas";
import { CombatEngine } from "../engine/CombatEngine";

export class SpireRoom extends Room<SpireState> {
    maxClients = 4;

    onCreate() {
        this.setState(new SpireState());
        this.registrarMensajes();
    }

    onJoin(client: Client, options: { nombre?: string }) {
        if (this.state.faseActual !== "LOBBY") throw new Error("La partida ya está en curso.");

        const jugador = new PlayerState();
        jugador.sessionId = client.sessionId;
        jugador.nombre = options?.nombre || `Jugador ${this.clients.length}`;
        const primerPj = Object.keys(PERSONAJES_INFO)[0] as PersonajeId;
        jugador.aplicarDatosPersonaje(primerPj);

        this.state.jugadores.set(client.sessionId, jugador);
    }

    onLeave(client: Client) {
        this.state.jugadores.delete(client.sessionId);
        if (this.state.faseActual === "LOBBY" && this.state.jugadores.size > 0) {
            this.verificarInicioPartida();
        } else if (this.state.faseActual === "COMBAT" && this.state.jugadores.size > 0) {
            this.verificarFinTurnoJugadores();
        } else if (this.state.faseActual === "REWARD" && this.state.jugadores.size > 0) {
            this.verificarFinRecompensas();
        }
    }

    private registrarMensajes() {
        this.onMessage(MENSAJES.ELEGIR_PERSONAJE, (client, data: { personajeId: PersonajeId }) => {
            if (this.state.faseActual !== "LOBBY") return;
            const jugador = this.state.jugadores.get(client.sessionId);
            if (!jugador || !PERSONAJES_INFO[data?.personajeId]) return;

            jugador.aplicarDatosPersonaje(data.personajeId);
            jugador.listo = false;
        });

        this.onMessage(MENSAJES.TOGGLE_LISTO, (client) => {
            if (this.state.faseActual !== "LOBBY") return;
            const jugador = this.state.jugadores.get(client.sessionId);
            if (!jugador) return;

            jugador.listo = !jugador.listo;
            this.verificarInicioPartida();
        });

        this.onMessage(MENSAJES.TERMINAR_TURNO, (client) => {
            if (this.state.faseActual !== "COMBAT") return;
            const jugador = this.state.jugadores.get(client.sessionId);
            if (!jugador || jugador.hp <= 0 || jugador.turnoTerminado) return;

            jugador.turnoTerminado = true;
            CombatEngine.descartarMano(jugador);
            this.verificarFinTurnoJugadores();
        });

        this.onMessage(MENSAJES.JUGAR_CARTA, (client, data: { indiceMano: number; objetivoId?: string }) => {
            const jugador = this.state.jugadores.get(client.sessionId);
            if (!jugador) return;

            const jugadaExitosa = CombatEngine.jugarCarta(this.state, jugador, data.indiceMano, data.objetivoId);
            if (jugadaExitosa && this.state.faseActual === "REWARD") {
                this.prepararRecompensas();
            }
        });

        this.onMessage(MENSAJES.ELEGIR_RECOMPENSA, (client, data: { cartaId: string | null }) => {
            if (this.state.faseActual !== "REWARD") return;
            const jugador = this.state.jugadores.get(client.sessionId);
            if (!jugador || jugador.recompensaElegida) return;

            if (data?.cartaId && jugador.opcionesRecompensa.includes(data.cartaId)) {
                jugador.mazoMaestro.push(data.cartaId);
            }

            jugador.recompensaElegida = true;
            jugador.opcionesRecompensa.clear();
            this.verificarFinRecompensas();
        });

        this.onMessage(MENSAJES.REINICIAR_PARTIDA, () => {
            if (this.state.faseActual !== "VICTORY" && this.state.faseActual !== "DEFEAT") return;

            this.state.pisoActual = 1;
            this.state.turnoNumero = 1;
            this.state.enemigos.clear();
            this.state.jugadores.forEach((j) => {
                j.listo = false;
                j.aplicarDatosPersonaje(j.personajeId);
            });
            this.state.faseActual = "LOBBY";
        });
    }

    private verificarInicioPartida() {
        if (this.state.jugadores.size === 0) return;
        let todosListos = true;
        this.state.jugadores.forEach((j) => { if (!j.listo) todosListos = false; });

        if (todosListos) {
            // Cargar mazo maestro inicial según personaje elegido
            this.state.jugadores.forEach((j) => {
                j.mazoMaestro.clear();
                obtenerMazoInicial(j.personajeId).forEach((id) => j.mazoMaestro.push(id));
            });
            this.iniciarCombate();
        }
    }

    public iniciarCombate() {
        this.state.faseActual = "COMBAT";
        this.state.turnoNumero = 1;
        this.state.enemigos.clear();

        const cantidadJugadores = Math.max(1, this.state.jugadores.size);
        const idsEnemigos = ENCUENTROS_POR_PISO[this.state.pisoActual] || ENCUENTROS_POR_PISO[1];

        idsEnemigos.forEach((enemigoId, index) => {
            const info = ENEMIGOS_INFO[enemigoId];
            if (!info) return;

            const enemigo = new EnemyState();
            enemigo.uid = `enemigo_${index}_${Date.now()}`;
            enemigo.enemigoId = info.id;
            enemigo.nombre = info.nombre;
            enemigo.hpMax = info.hpBase * cantidadJugadores;
            enemigo.hp = enemigo.hpMax;
            enemigo.indicePatron = 0;
            enemigo.intencionTipo = info.patron[0].tipo;
            enemigo.intencionValor = info.patron[0].valor;
            this.state.enemigos.push(enemigo);
        });

        this.state.jugadores.forEach((j) => {
            if (j.hp > 0) CombatEngine.prepararMazoCombate(j);
        });

        this.iniciarNuevoTurnoJugadores();
    }

    private verificarFinTurnoJugadores() {
        let todosTerminaron = true;
        this.state.jugadores.forEach((j) => {
            if (j.hp > 0 && !j.turnoTerminado) todosTerminaron = false;
        });

        if (todosTerminaron) {
            CombatEngine.ejecutarTurnoEnemigos(this.state);

            let hayAlgunVivo = false;
            this.state.jugadores.forEach((j) => {
                if (j.hp > 0) {
                    hayAlgunVivo = true;
                    CombatEngine.reducirEstadosPorTurno(j);
                }
            });

            if (!hayAlgunVivo) {
                this.state.faseActual = "DEFEAT";
                return;
            }

            this.state.turnoNumero += 1;
            this.iniciarNuevoTurnoJugadores();
        }
    }

    private iniciarNuevoTurnoJugadores() {
        this.state.jugadores.forEach((j) => {
            if (j.hp <= 0) return;
            j.bloqueo = 0;
            j.energia = j.energiaMax;
            j.turnoTerminado = false;
            CombatEngine.robarCartas(j, 5);
        });
    }

    private prepararRecompensas() {
        this.state.jugadores.forEach((jugador) => {
            // Revivimos a los caídos con 30% de vida al ganar el combate
            if (jugador.hp <= 0) {
                jugador.hp = Math.max(1, Math.floor(jugador.hpMax * 0.3));
            }
            jugador.recompensaElegida = false;
            jugador.opcionesRecompensa.clear();

            const opciones = generarOpcionesRecompensa(jugador.personajeId, 3);
            opciones.forEach((id) => jugador.opcionesRecompensa.push(id));
        });
    }

    private verificarFinRecompensas() {
        let todosEligieron = true;
        this.state.jugadores.forEach((j) => {
            if (!j.recompensaElegida) todosEligieron = false;
        });

        if (todosEligieron) {
            this.state.pisoActual += 1;
            this.iniciarCombate();
        }
    }
}