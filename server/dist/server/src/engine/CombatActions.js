"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccionVerificarFinCombate = exports.AccionProcesarMuerte = exports.AccionRobarCartas = exports.AccionGanarEnergia = exports.AccionCurarHp = exports.AccionAplicarEstado = exports.AccionGanarBloqueo = exports.AccionAplicarDanio = exports.AccionPerderHp = exports.AccionModificarOro = void 0;
exports.obtenerIdEntidad = obtenerIdEntidad;
const SpireState_1 = require("../rooms/schema/SpireState");
const CalculadoraCombate_1 = require("../../../assets/cliente/compartido/CalculadoraCombate");
const Mapa_1 = require("../../../assets/cliente/compartido/Mapa");
const PlayerStatsHelper_1 = require("./PlayerStatsHelper");
function obtenerIdEntidad(entidad) {
    return entidad instanceof SpireState_1.PlayerState ? entidad.sessionId : entidad.uid;
}
class AccionModificarOro {
    constructor(jugador, delta) {
        this.jugador = jugador;
        this.delta = delta;
    }
    ejecutar(_state, cola) {
        PlayerStatsHelper_1.PlayerStatsHelper.modificarOro(this.jugador, this.delta, cola);
    }
}
exports.AccionModificarOro = AccionModificarOro;
class AccionPerderHp {
    constructor(objetivo, cantidad, autor) {
        this.objetivo = objetivo;
        this.cantidad = cantidad;
        this.autor = autor;
    }
    ejecutar(state, cola) {
        if (this.objetivo.hp <= 0 || this.cantidad <= 0)
            return;
        let perdidoReal = 0;
        if (this.objetivo instanceof SpireState_1.PlayerState) {
            const res = PlayerStatsHelper_1.PlayerStatsHelper.aplicarPerdidaHpJugador(state, this.objetivo, this.cantidad, {
                permitirMuerte: true,
                cola
            });
            perdidoReal = res.hpPerdidoReal;
        }
        else {
            const antes = this.objetivo.hp;
            this.objetivo.hp = Math.max(0, this.objetivo.hp - this.cantidad);
            perdidoReal = antes - this.objetivo.hp;
        }
        cola.emitirVisual({
            tipo: "IMPACTO_DANIO",
            objetivoId: obtenerIdEntidad(this.objetivo),
            atacanteId: this.autor ? obtenerIdEntidad(this.autor) : undefined,
            danioAlHp: perdidoReal,
            danioBloqueado: 0,
            hpRestante: this.objetivo.hp,
            bloqueoRestante: this.objetivo.bloqueo,
            fuente: "EFECTO_DIRECTO"
        });
        if (this.objetivo.hp <= 0) {
            cola.encolarAlInicio(new AccionProcesarMuerte(this.objetivo, this.autor));
        }
    }
}
exports.AccionPerderHp = AccionPerderHp;
class AccionAplicarDanio {
    constructor(atacante, defensor, danioBase, fuente = "ATAQUE_CARTA", extra = {}) {
        this.atacante = atacante;
        this.defensor = defensor;
        this.danioBase = danioBase;
        this.fuente = fuente;
        this.extra = extra;
    }
    ejecutar(state, cola, bus) {
        if (this.defensor.hp <= 0 || state.faseActual !== "COMBAT")
            return;
        if ((this.fuente === "ATAQUE_CARTA" || this.fuente === "ATAQUE_ENEMIGO") &&
            this.atacante &&
            this.atacante.hp <= 0) {
            return;
        }
        const multFuerza = this.extra.multiplicadorFuerza ?? 1;
        let monto = this.fuente === "ATAQUE_CARTA" || this.fuente === "ATAQUE_ENEMIGO"
            ? CalculadoraCombate_1.CalculadoraCombate.calcularDanioAtaque(this.danioBase, this.atacante?.estados, this.defensor.estados, multFuerza)
            : Math.max(0, this.danioBase);
        // --- NUEVAS MECÁNICAS NITROMEME ANTES DEL GOLPE ---
        if (this.defensor instanceof SpireState_1.EnemyState) {
            // Vuelo (-50% daño, se rompe con golpes)
            if ((this.defensor.estados.get("VUELO") || 0) > 0) {
                monto = Math.floor(monto * 0.5);
                const golpesRecibidos = (this.defensor.estados.get("GOLPES_RECIBIDOS") || 0) + 1;
                this.defensor.estados.set("GOLPES_RECIBIDOS", golpesRecibidos);
                if (golpesRecibidos >= (3 * state.jugadores.size) + 1) {
                    this.defensor.estados.delete("VUELO");
                    cola.encolarAlInicio(new AccionAplicarEstado(this.defensor, "ATURDIDO", 1));
                }
            }
            // Asustadizo (Bloqueo al recibir el primer golpe del turno)
            const asustadizo = this.defensor.estados.get("ASUSTADIZO") || 0;
            if (asustadizo > 0 && !this.defensor.estados.has("ASUSTADIZO_USADO")) {
                this.defensor.estados.set("ASUSTADIZO_USADO", 1);
                this.defensor.bloqueo += asustadizo; // Agrega el bloqueo ANTES de recibir este golpe
                cola.emitirVisual({
                    tipo: "BLOQUEO_GANADO",
                    entidadId: this.defensor.uid,
                    cantidad: asustadizo,
                    bloqueoTotal: this.defensor.bloqueo
                });
            }
            // Reflejar
            if ((this.defensor.estados.get("REFLEJAR") || 0) > 0) {
                if (monto > 0 && this.atacante && this.atacante.hp > 0) {
                    cola.encolarAlFinal(new AccionAplicarDanio(this.defensor, this.atacante, monto, "EFECTO_DIRECTO"));
                }
            }
        }
        // --- CÁLCULO ESTÁNDAR ---
        const bloqueoAntes = this.defensor.bloqueo;
        const ignoraBloqueo = this.fuente === "VENENO";
        const danioBloqueado = ignoraBloqueo ? 0 : Math.min(this.defensor.bloqueo, monto);
        const danioRestante = Math.max(0, monto - danioBloqueado);
        this.defensor.bloqueo = Math.max(0, this.defensor.bloqueo - danioBloqueado);
        // Enterrado (Stun si le rompen el escudo)
        if (this.defensor instanceof SpireState_1.EnemyState && (this.defensor.estados.get("ENTERRADO") || 0) > 0) {
            if (bloqueoAntes > 0 && this.defensor.bloqueo === 0) {
                this.defensor.estados.delete("ENTERRADO");
                cola.encolarAlFinal(new AccionAplicarEstado(this.defensor, "ATURDIDO", 1));
            }
        }
        let hpPerdidoReal = 0;
        if (this.defensor instanceof SpireState_1.PlayerState) {
            const res = PlayerStatsHelper_1.PlayerStatsHelper.aplicarPerdidaHpJugador(state, this.defensor, danioRestante, {
                permitirMuerte: true,
                cola
            });
            hpPerdidoReal = res.hpPerdidoReal;
        }
        else {
            const hpAntes = this.defensor.hp;
            this.defensor.hp = Math.max(0, this.defensor.hp - danioRestante);
            hpPerdidoReal = hpAntes - this.defensor.hp;
        }
        cola.emitirVisual({
            tipo: "IMPACTO_DANIO",
            objetivoId: obtenerIdEntidad(this.defensor),
            atacanteId: this.atacante ? obtenerIdEntidad(this.atacante) : undefined,
            danioAlHp: hpPerdidoReal,
            danioBloqueado,
            hpRestante: this.defensor.hp,
            bloqueoRestante: this.defensor.bloqueo,
            fuente: this.fuente
        });
        // Oro para el jugador
        if (this.atacante instanceof SpireState_1.PlayerState && this.defensor instanceof SpireState_1.EnemyState) {
            if (hpPerdidoReal > 0 && this.extra.oroPorGolpeAlHp && this.extra.oroPorGolpeAlHp > 0) {
                cola.encolarAlInicio(new AccionModificarOro(this.atacante, this.extra.oroPorGolpeAlHp));
            }
            if (this.defensor.hp <= 0 && this.extra.oroSiMata && this.extra.oroSiMata > 0) {
                cola.encolarAlInicio(new AccionModificarOro(this.atacante, this.extra.oroSiMata));
            }
        }
        // --- EFECTOS NITROMEME POST-GOLPE Y ESPINAS ---
        if (this.defensor instanceof SpireState_1.PlayerState && this.atacante instanceof SpireState_1.EnemyState && this.fuente === "ATAQUE_ENEMIGO") {
            if (hpPerdidoReal > 0) {
                bus.emitir("AL_RECIBIR_DANIO", { state, cola, defensor: this.defensor, atacante: this.atacante, danioRecibido: hpPerdidoReal, fuente: this.fuente });
            }
            const espinas = this.defensor.estados.get("ESPINAS") || 0;
            if (espinas > 0 && this.atacante.hp > 0) {
                cola.encolarAlInicio(new AccionAplicarDanio(this.defensor, this.atacante, espinas, "ESPINAS"));
            }
            // Pone Heridas (Doublé Edge / Gusano)
            if (hpPerdidoReal > 0 && (this.atacante.estados.get("PONE_HERIDAS") || 0) > 0) {
                cola.encolarAlFinal({
                    ejecutar: () => {
                        const def = this.defensor;
                        def.descarteInterno.push("maldicion_herida");
                        def.descarte.push("maldicion_herida");
                        def.cantDescarte = def.descarteInterno.length;
                    }
                });
            }
        }
        if (this.atacante instanceof SpireState_1.PlayerState && this.defensor instanceof SpireState_1.EnemyState && this.fuente === "ATAQUE_CARTA") {
            if (hpPerdidoReal > 0 && this.defensor.hp > 0) {
                bus.emitir("AL_INFLIGIR_DANIO", { state, cola, atacante: this.atacante, defensor: this.defensor, danioInfligido: hpPerdidoReal, fuente: this.fuente });
                // Enfurecido (Ete Bull)
                if ((this.defensor.estados.get("ENFURECIDO") || 0) > 0) {
                    cola.encolarAlFinal(new AccionAplicarEstado(this.defensor, "FUERZA", 1));
                }
            }
            const espinasEnemigo = this.defensor.estados.get("ESPINAS") || 0;
            if (espinasEnemigo > 0 && this.atacante.hp > 0) {
                cola.encolarAlInicio(new AccionAplicarDanio(this.defensor, this.atacante, espinasEnemigo, "ESPINAS"));
            }
        }
        if (this.defensor.hp <= 0) {
            cola.encolarAlInicio(new AccionProcesarMuerte(this.defensor, this.atacante));
        }
    }
}
exports.AccionAplicarDanio = AccionAplicarDanio;
class AccionGanarBloqueo {
    constructor(objetivo, valor, lanzadorParaDestreza) {
        this.objetivo = objetivo;
        this.valor = valor;
        this.lanzadorParaDestreza = lanzadorParaDestreza;
    }
    ejecutar(_state, cola) {
        if (this.objetivo.hp <= 0)
            return;
        const montoFinal = CalculadoraCombate_1.CalculadoraCombate.calcularBloqueo(this.valor, this.lanzadorParaDestreza?.estados, this.objetivo.estados);
        if (montoFinal <= 0)
            return;
        this.objetivo.bloqueo += montoFinal;
        cola.emitirVisual({
            tipo: "BLOQUEO_GANADO",
            entidadId: obtenerIdEntidad(this.objetivo),
            cantidad: montoFinal,
            bloqueoTotal: this.objetivo.bloqueo
        });
    }
}
exports.AccionGanarBloqueo = AccionGanarBloqueo;
class AccionAplicarEstado {
    constructor(objetivo, estadoId, valor) {
        this.objetivo = objetivo;
        this.estadoId = estadoId;
        this.valor = valor;
    }
    ejecutar(_state, cola) {
        if (this.objetivo.hp <= 0 || this.valor === 0)
            return;
        const actual = this.objetivo.estados.get(this.estadoId) || 0;
        const nuevoTotal = actual + this.valor;
        if (nuevoTotal === 0) {
            this.objetivo.estados.delete(this.estadoId);
        }
        else {
            this.objetivo.estados.set(this.estadoId, nuevoTotal);
        }
        cola.emitirVisual({
            tipo: "ESTADO_APLICADO",
            entidadId: obtenerIdEntidad(this.objetivo),
            estadoId: this.estadoId,
            valorAgregado: this.valor,
            valorTotal: nuevoTotal
        });
    }
}
exports.AccionAplicarEstado = AccionAplicarEstado;
class AccionCurarHp {
    constructor(objetivo, valor) {
        this.objetivo = objetivo;
        this.valor = valor;
    }
    ejecutar(_state, cola) {
        if (this.objetivo.hp <= 0 || this.valor <= 0)
            return;
        const antes = this.objetivo.hp;
        this.objetivo.hp = Math.min(this.objetivo.hpMax, this.objetivo.hp + this.valor);
        const curado = this.objetivo.hp - antes;
        if (curado > 0) {
            cola.emitirVisual({
                tipo: "CURACION_RECIBIDA",
                entidadId: obtenerIdEntidad(this.objetivo),
                cantidad: curado,
                hpActual: this.objetivo.hp
            });
        }
    }
}
exports.AccionCurarHp = AccionCurarHp;
class AccionGanarEnergia {
    constructor(jugador, valor) {
        this.jugador = jugador;
        this.valor = valor;
    }
    ejecutar() {
        if (this.jugador.hp <= 0 || this.valor === 0)
            return;
        this.jugador.energia = Math.max(0, this.jugador.energia + this.valor);
    }
}
exports.AccionGanarEnergia = AccionGanarEnergia;
class AccionRobarCartas {
    constructor(jugador, cantidad, mezclarCallback, actualizarContadoresCallback) {
        this.jugador = jugador;
        this.cantidad = cantidad;
        this.mezclarCallback = mezclarCallback;
        this.actualizarContadoresCallback = actualizarContadoresCallback;
    }
    ejecutar() {
        if (this.jugador.hp <= 0 || this.cantidad <= 0)
            return;
        if ((this.jugador.estados.get("SIN_ROBO") || 0) > 0)
            return;
        for (let i = 0; i < this.cantidad; i++) {
            if (this.jugador.mano.length >= 10)
                break;
            if (this.jugador.pilaRoboInterna.length === 0) {
                if (this.jugador.descarteInterno.length === 0)
                    break;
                this.jugador.pilaRoboInterna = [...this.jugador.descarteInterno];
                this.jugador.descarteInterno = [];
                this.mezclarCallback(this.jugador.pilaRoboInterna);
            }
            const cartaRobada = this.jugador.pilaRoboInterna.pop();
            if (cartaRobada) {
                this.jugador.mano.push(cartaRobada);
            }
        }
        this.actualizarContadoresCallback(this.jugador);
    }
}
exports.AccionRobarCartas = AccionRobarCartas;
class AccionProcesarMuerte {
    constructor(entidadMuerta, autorMuerte) {
        this.entidadMuerta = entidadMuerta;
        this.autorMuerte = autorMuerte;
    }
    ejecutar(state, cola, bus) {
        if (this.entidadMuerta.hp > 0)
            return;
        this.entidadMuerta.bloqueo = 0;
        if (this.entidadMuerta instanceof SpireState_1.PlayerState) {
            this.entidadMuerta.turnoTerminado = true;
        }
        cola.emitirVisual({
            tipo: "ENTIDAD_MURIO",
            entidadId: obtenerIdEntidad(this.entidadMuerta),
            esEnemigo: this.entidadMuerta instanceof SpireState_1.EnemyState
        });
        bus.emitir("AL_MORIR_ENTIDAD", {
            state,
            cola,
            entidadMuerta: this.entidadMuerta,
            autorMuerte: this.autorMuerte
        });
        // Explosión del Ox al morir
        if (this.entidadMuerta instanceof SpireState_1.EnemyState && this.entidadMuerta.enemigoId === "ox") {
            cola.encolarAlFinal({
                ejecutar: (st, q) => {
                    let victima = this.autorMuerte instanceof SpireState_1.PlayerState && this.autorMuerte.hp > 0
                        ? this.autorMuerte : undefined;
                    if (!victima) {
                        const vivos = Array.from(st.jugadores.values()).filter(j => j.hp > 0);
                        if (vivos.length > 0) {
                            victima = vivos[Math.floor(Math.random() * vivos.length)];
                        }
                    }
                    if (victima) {
                        q.encolarAlInicio(new AccionAplicarDanio(this.entidadMuerta, victima, 40, "EFECTO_DIRECTO"));
                    }
                }
            });
        }
        cola.encolarAlFinal(new AccionVerificarFinCombate());
    }
}
exports.AccionProcesarMuerte = AccionProcesarMuerte;
class AccionFinalizarFaseCombate {
    constructor(faseDestino) {
        this.faseDestino = faseDestino;
    }
    ejecutar(state) {
        state.combateFinalizando = false;
        state.faseActual = this.faseDestino;
    }
}
class AccionVerificarFinCombate {
    ejecutar(state, cola, bus) {
        if (state.faseActual !== "COMBAT" || state.combateFinalizando)
            return;
        const quedaEnemigoVivo = state.enemigos.some((e) => e.hp > 0);
        if (!quedaEnemigoVivo) {
            // Marcamos finalización y dejamos que AL_FINALIZAR_COMBATE (Bandita, Megahucha, Chuleta)
            // resuelva todas sus acciones encoladas ANTES de cambiar faseActual
            state.combateFinalizando = true;
            bus.emitir("AL_FINALIZAR_COMBATE", { state, cola });
            const esJefeFinalRun = state.esCombateJefe && state.mapaActual >= Mapa_1.CONFIG_MAPA.TOTAL_MAPAS;
            cola.encolarAlFinal(new AccionFinalizarFaseCombate(esJefeFinalRun ? "VICTORY" : "REWARD"));
            return;
        }
        let quedaJugadorVivo = false;
        state.jugadores.forEach((j) => {
            if (j.hp > 0)
                quedaJugadorVivo = true;
        });
        if (!quedaJugadorVivo) {
            state.faseActual = "DEFEAT";
        }
    }
}
exports.AccionVerificarFinCombate = AccionVerificarFinCombate;
