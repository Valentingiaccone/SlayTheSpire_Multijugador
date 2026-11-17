import { Room, Client, Delayed } from "colyseus";
import { SpireState, PlayerState, EnemyState, MapNodeState } from "./schema/SpireState";
import { MENSAJES, PersonajeId, PERSONAJES_INFO } from "../../../assets/cliente/compartido/GameTypes";
import { ENEMIGOS_INFO, obtenerEncuentroAleatorio } from "../../../assets/cliente/compartido/Enemigos";
import { generarOpcionesRecompensa, obtenerMazoInicial } from "../../../assets/cliente/compartido/Cartas";
import { obtenerReliquiasRecompensa } from "../../../assets/cliente/compartido/Reliquias";
import { CONFIG_MAPA, generarMapaRun } from "../../../assets/cliente/compartido/Mapa";
import { CombatEngine } from "../engine/CombatEngine";
import { RelicEngine } from "../engine/RelicEngine";

export class SpireRoom extends Room<SpireState> {
    maxClients = 4;
    private timerMapa: Delayed | null = null;
    private timerCofre: Delayed | null = null;
    private firmaVotosCofreActual: string = "";

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
        if (this.state.jugadores.size === 0) {
            this.cancelarCuentaRegresivaMapa();
            this.cancelarCuentaRegresivaCofre();
            return;
        }

        if (this.state.faseActual === "LOBBY") this.verificarInicioPartida();
        else if (this.state.faseActual === "MAP") this.evaluarVotosMapa();
        else if (this.state.faseActual === "COMBAT") this.verificarFinTurnoJugadores();
        else if (this.state.faseActual === "REWARD") this.verificarFinRecompensas();
        else if (this.state.faseActual === "CHEST" && this.state.cofreAbierto) this.evaluarVotosCofre();
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

        this.onMessage(MENSAJES.VOTAR_NODO, (client, data: { nodoId: string }) => {
            if (this.state.faseActual !== "MAP") return;
            const jugador = this.state.jugadores.get(client.sessionId);
            if (!jugador) return;

            const nodo = this.state.nodosMapa.find((n) => n.id === data?.nodoId);
            if (!nodo || nodo.estado !== "DISPONIBLE") return;

            jugador.nodoVotadoId = nodo.id;
            this.evaluarVotosMapa();
        });

        this.onMessage(MENSAJES.TERMINAR_TURNO, (client) => {
            if (this.state.faseActual !== "COMBAT") return;
            const jugador = this.state.jugadores.get(client.sessionId);
            if (!jugador || jugador.hp <= 0 || jugador.turnoTerminado) return;

            jugador.turnoTerminado = true;
            // Disparar reliquias AL_TERMINAR_TURNO (ej. Sobrecarga)
            RelicEngine.dispararParaJugador("AL_TERMINAR_TURNO", this.state, jugador);

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

        // Recibe la carta seleccionada (o null) y si seleccionó la reliquia de Élite al darle a Continuar
        this.onMessage(
            MENSAJES.ELEGIR_RECOMPENSA,
            (client, data: { cartaId: string | null; tomarReliquia?: boolean }) => {
                if (this.state.faseActual !== "REWARD") return;
                const jugador = this.state.jugadores.get(client.sessionId);
                if (!jugador || jugador.recompensaElegida) return;

                if (data?.cartaId && jugador.opcionesRecompensa.includes(data.cartaId)) {
                    jugador.mazoMaestro.push(data.cartaId);
                }

                if (data?.tomarReliquia && jugador.reliquiaRecompensa) {
                    jugador.reliquias.push(jugador.reliquiaRecompensa);
                }

                jugador.recompensaElegida = true;
                jugador.opcionesRecompensa.clear();
                jugador.reliquiaRecompensa = "";
                this.verificarFinRecompensas();
            }
        );

        // ================= EVENTO COFRE =================
        this.onMessage(MENSAJES.ABRIR_COFRE, () => {
            if (this.state.faseActual !== "CHEST" || this.state.cofreAbierto) return;

            this.state.cofreAbierto = true;
            this.state.reliquiasCofre.clear();

            const cantJugadores = Math.max(1, this.state.jugadores.size);
            const reliquiasGeneradas = obtenerReliquiasRecompensa(this.state.jugadores, cantJugadores);
            reliquiasGeneradas.forEach((rId) => this.state.reliquiasCofre.push(rId));
        });

        this.onMessage(MENSAJES.VOTAR_RELIQUIA_COFRE, (client, data: { reliquiaId: string }) => {
            if (this.state.faseActual !== "CHEST" || !this.state.cofreAbierto) return;
            const jugador = this.state.jugadores.get(client.sessionId);
            if (!jugador) return;

            if (!this.state.reliquiasCofre.includes(data?.reliquiaId)) return;

            // Si toca la misma que ya tenía votada, la deselecciona; si no, la selecciona
            jugador.reliquiaCofreVotadaId =
                jugador.reliquiaCofreVotadaId === data.reliquiaId ? "" : data.reliquiaId;

            this.evaluarVotosCofre();
        });

        this.onMessage(MENSAJES.REINICIAR_PARTIDA, () => {
            if (this.state.faseActual !== "VICTORY" && this.state.faseActual !== "DEFEAT") return;

            this.cancelarCuentaRegresivaMapa();
            this.cancelarCuentaRegresivaCofre();
            this.state.pisoActual = 1;
            this.state.turnoNumero = 1;
            this.state.nodoActualId = "";
            this.state.nodosMapa.clear();
            this.state.enemigos.clear();
            this.state.jugadores.forEach((j) => {
                j.listo = false;
                j.nodoVotadoId = "";
                j.reliquiaCofreVotadaId = "";
                j.reliquias.clear();
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
            this.state.jugadores.forEach((j) => {
                j.mazoMaestro.clear();
                obtenerMazoInicial(j.personajeId).forEach((id) => j.mazoMaestro.push(id));

                // Cargar reliquia inicial exclusiva del personaje
                j.reliquias.clear();
                const info = PERSONAJES_INFO[j.personajeId];
                if (info?.reliquiaInicial) {
                    j.reliquias.push(info.reliquiaInicial);
                }
                j.nodoVotadoId = "";
            });

            this.inicializarMapaNuevaRun();
        }
    }

    private inicializarMapaNuevaRun() {
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

    private abrirFaseMapa() {
        this.cancelarCuentaRegresivaMapa();
        this.state.jugadores.forEach((j) => { j.nodoVotadoId = ""; });
        this.state.faseActual = "MAP";
    }

    private evaluarVotosMapa() {
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
            this.cancelarCuentaRegresivaMapa();
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
            this.cancelarCuentaRegresivaMapa();
            this.state.hayEmpateMapa = true;
            return;
        }

        const ganadorId = candidatosGanadores[0];
        this.state.hayEmpateMapa = false;

        if (this.timerMapa && this.state.nodoGanadorMapaId === ganadorId) {
            return;
        }

        this.iniciarCuentaRegresivaMapa(ganadorId);
    }

    private iniciarCuentaRegresivaMapa(ganadorId: string) {
        this.cancelarCuentaRegresivaMapa();
        this.state.nodoGanadorMapaId = ganadorId;
        this.state.tiempoCuentaRegresivaMapa = CONFIG_MAPA.SEGUNDOS_CUENTA_REGRESIVA;

        this.timerMapa = this.clock.setInterval(() => {
            this.state.tiempoCuentaRegresivaMapa -= 1;
            if (this.state.tiempoCuentaRegresivaMapa <= 0) {
                const destinoId = this.state.nodoGanadorMapaId;
                this.cancelarCuentaRegresivaMapa();
                this.viajarANodo(destinoId);
            }
        }, 1000);
    }

    private cancelarCuentaRegresivaMapa() {
        if (this.timerMapa) {
            this.timerMapa.clear();
            this.timerMapa = null;
        }
        this.state.tiempoCuentaRegresivaMapa = 0;
        this.state.nodoGanadorMapaId = "";
        this.state.hayEmpateMapa = false;
    }

    private viajarANodo(nodoId: string) {
        const nodoElegido = this.state.nodosMapa.find((n) => n.id === nodoId);
        if (!nodoElegido) return;

        this.state.nodosMapa.forEach((n) => {
            if (n.estado === "ACTUAL") n.estado = "COMPLETADO";
            else if (n.estado === "DISPONIBLE" && n.id !== nodoElegido.id) n.estado = "BLOQUEADO";
        });

        nodoElegido.estado = "ACTUAL";
        this.state.nodoActualId = nodoElegido.id;
        this.state.pisoActual = nodoElegido.piso;
        this.state.jugadores.forEach((j) => { j.nodoVotadoId = ""; });

        switch (nodoElegido.tipo) {
            case "JEFE":
                this.iniciarCombate("JEFE");
                break;
            case "ELITE":
                this.iniciarCombate("ELITE");
                break;
            case "COFRE":
                this.iniciarEventoCofre();
                break;
            case "COMBATE":
            default:
                this.iniciarCombate("COMBATE");
                break;
        }
    }

    // ================= LÓGICA DE COFRE =================
    private iniciarEventoCofre() {
        this.cancelarCuentaRegresivaCofre();
        this.state.cofreAbierto = false;
        this.state.reliquiasCofre.clear();
        this.state.jugadores.forEach((j) => { j.reliquiaCofreVotadaId = ""; });
        this.state.faseActual = "CHEST";
    }

    private evaluarVotosCofre() {
        const totalJugadores = this.state.jugadores.size;
        if (totalJugadores === 0) return;

        let elegidos = 0;
        const conteoPorReliquia: Map<string, number> = new Map();
        const paresFirma: string[] = [];

        this.state.jugadores.forEach((j, sessionId) => {
            if (j.reliquiaCofreVotadaId) {
                elegidos++;
                conteoPorReliquia.set(
                    j.reliquiaCofreVotadaId,
                    (conteoPorReliquia.get(j.reliquiaCofreVotadaId) || 0) + 1
                );
                paresFirma.push(`${sessionId}:${j.reliquiaCofreVotadaId}`);
            }
        });

        // Revisar si dos o más jugadores votaron la misma reliquia
        let hayColision = false;
        conteoPorReliquia.forEach((cant) => {
            if (cant > 1) hayColision = true;
        });

        this.state.hayConflictoCofre = hayColision;

        if (elegidos < totalJugadores || hayColision) {
            this.cancelarCuentaRegresivaCofre();
            return;
        }

        // Todos eligieron reliquias distintas
        const nuevaFirma = paresFirma.sort().join("|");
        if (this.timerCofre && this.firmaVotosCofreActual === nuevaFirma) {
            return;
        }

        this.iniciarCuentaRegresivaCofre(nuevaFirma);
    }

    private iniciarCuentaRegresivaCofre(firma: string) {
        this.cancelarCuentaRegresivaCofre();
        this.firmaVotosCofreActual = firma;
        this.state.tiempoCuentaRegresivaCofre = CONFIG_MAPA.SEGUNDOS_CUENTA_REGRESIVA;

        this.timerCofre = this.clock.setInterval(() => {
            this.state.tiempoCuentaRegresivaCofre -= 1;
            if (this.state.tiempoCuentaRegresivaCofre <= 0) {
                this.cancelarCuentaRegresivaCofre();
                this.entregarReliquiasCofreYAvanzar();
            }
        }, 1000);
    }

    private cancelarCuentaRegresivaCofre() {
        if (this.timerCofre) {
            this.timerCofre.clear();
            this.timerCofre = null;
        }
        this.firmaVotosCofreActual = "";
        this.state.tiempoCuentaRegresivaCofre = 0;
    }

    private entregarReliquiasCofreYAvanzar() {
        this.state.jugadores.forEach((j) => {
            if (j.reliquiaCofreVotadaId) {
                j.reliquias.push(j.reliquiaCofreVotadaId);
                j.reliquiaCofreVotadaId = "";
            }
        });

        this.desbloquearSiguientesNodosMapa();
        this.abrirFaseMapa();
    }

    // ================= LÓGICA DE COMBATE =================
    public iniciarCombate(tipoCombate: "COMBATE" | "ELITE" | "JEFE" = "COMBATE") {
        this.state.faseActual = "COMBAT";
        this.state.turnoNumero = 1;
        this.state.esCombateElite = tipoCombate === "ELITE";
        this.state.esCombateJefe = tipoCombate === "JEFE";
        this.state.enemigos.clear();

        const cantidadJugadores = Math.max(1, this.state.jugadores.size);
        const idsEnemigos = obtenerEncuentroAleatorio(tipoCombate, this.state.pisoActual);

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

        // 1. Iniciar el Turno 1 de los jugadores
        this.iniciarNuevoTurnoJugadores(true);
    }

    private verificarFinTurnoJugadores() {
        let todosTerminaron = true;
        this.state.jugadores.forEach((j) => {
            if (j.hp > 0 && !j.turnoTerminado) todosTerminaron = false;
        });

        if (todosTerminaron) {
            CombatEngine.ejecutarTurnoEnemigos(this.state);

            // Si los enemigos murieron por ESPINAS o VENENO durante su propio ataque:
            if (this.state.faseActual === "REWARD") {
                this.prepararRecompensas();
                return;
            }
            if (this.state.faseActual === "VICTORY") return;

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
            this.iniciarNuevoTurnoJugadores(false);
        }
    }

    private iniciarNuevoTurnoJugadores(esInicioCombate: boolean = false) {
        this.state.jugadores.forEach((j) => {
            if (j.hp <= 0) return;
            j.bloqueo = 0;
            CombatEngine.procesarInicioTurno(j);
            if (j.hp <= 0) return;
            j.energia = j.energiaMax;
            j.turnoTerminado = false;
            j.cartasJugadasTurno = 0;
            j.ataquesJugadosTurno = 0;
            CombatEngine.robarCartas(j, 5);
        });

        // Si es el turno 1, disparamos AL_INICIAR_COMBATE (después de resetear bloqueo a 0, así Distintivo de Abogado mantiene sus 10 de escudo)
        if (esInicioCombate) {
            RelicEngine.dispararParaTodos("AL_INICIAR_COMBATE", this.state);
        }

        // Disparar reliquias AL_INICIAR_TURNO (Cocoroch, Engranaje Par, Estandarte, etc.)
        RelicEngine.dispararParaTodos("AL_INICIAR_TURNO", this.state);

        // Por si una reliquia de inicio de turno (como Núcleo del Séptimo Turno) mata a todos los enemigos
        CombatEngine.verificarVictoriaCombate(this.state);
        if (this.state.faseActual === "REWARD") {
            this.prepararRecompensas();
        }
    }

    private prepararRecompensas() {
        this.state.jugadores.forEach((jugador) => {
            if (jugador.hp <= 0) {
                jugador.hp = Math.max(1, Math.floor(jugador.hpMax * 0.3));
            }
            jugador.recompensaElegida = false;
            jugador.opcionesRecompensa.clear();
            jugador.reliquiaRecompensa = "";

            const opciones = generarOpcionesRecompensa(jugador.personajeId, 3);
            opciones.forEach((id) => jugador.opcionesRecompensa.push(id));

            // Si vencieron a un Élite, cada jugador recibe además 1 opción de reliquia
            if (this.state.esCombateElite) {
                const reliquias = obtenerReliquiasRecompensa(this.state.jugadores, 1, jugador.personajeId);
                jugador.reliquiaRecompensa = reliquias[0] || "";
            }
        });
    }

    private verificarFinRecompensas() {
        let todosEligieron = true;
        this.state.jugadores.forEach((j) => {
            if (!j.recompensaElegida) todosEligieron = false;
        });

        if (todosEligieron) {
            this.desbloquearSiguientesNodosMapa();
            this.abrirFaseMapa();
        }
    }

    private desbloquearSiguientesNodosMapa() {
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
}