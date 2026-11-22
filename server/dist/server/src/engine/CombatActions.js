"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccionVerificarFinCombate = exports.AccionProcesarMuerte = exports.AccionRobarCartas = exports.AccionGanarEnergia = exports.AccionCurarHp = exports.AccionAplicarEstado = exports.AccionGanarBloqueo = exports.AccionAplicarDanio = void 0;
exports.obtenerIdEntidad = obtenerIdEntidad;
const SpireState_1 = require("../rooms/schema/SpireState");
const CalculadoraCombate_1 = require("../../../assets/cliente/compartido/CalculadoraCombate");
const Mapa_1 = require("../../../assets/cliente/compartido/Mapa");
function obtenerIdEntidad(entidad) {
    return entidad instanceof SpireState_1.PlayerState ? entidad.sessionId : entidad.uid;
}
class AccionAplicarDanio {
    constructor(atacante, defensor, danioBase, fuente = "ATAQUE_CARTA") {
        this.atacante = atacante;
        this.defensor = defensor;
        this.danioBase = danioBase;
        this.fuente = fuente;
    }
    ejecutar(state, cola, bus) {
        if (this.defensor.hp <= 0 || state.faseActual !== "COMBAT")
            return;
        if ((this.fuente === "ATAQUE_CARTA" || this.fuente === "ATAQUE_ENEMIGO") &&
            this.atacante &&
            this.atacante.hp <= 0) {
            return;
        }
        const monto = this.fuente === "ATAQUE_CARTA" || this.fuente === "ATAQUE_ENEMIGO"
            ? CalculadoraCombate_1.CalculadoraCombate.calcularDanioAtaque(this.danioBase, this.atacante?.estados, this.defensor.estados)
            : Math.max(0, this.danioBase);
        const ignoraBloqueo = this.fuente === "VENENO";
        const danioBloqueado = ignoraBloqueo ? 0 : Math.min(this.defensor.bloqueo, monto);
        const danioAlHp = Math.max(0, monto - danioBloqueado);
        this.defensor.bloqueo = Math.max(0, this.defensor.bloqueo - danioBloqueado);
        this.defensor.hp = Math.max(0, this.defensor.hp - danioAlHp);
        cola.emitirVisual({
            tipo: "IMPACTO_DANIO",
            objetivoId: obtenerIdEntidad(this.defensor),
            atacanteId: this.atacante ? obtenerIdEntidad(this.atacante) : undefined,
            danioAlHp,
            danioBloqueado,
            hpRestante: this.defensor.hp,
            bloqueoRestante: this.defensor.bloqueo,
            fuente: this.fuente
        });
        if (this.defensor instanceof SpireState_1.PlayerState &&
            this.atacante instanceof SpireState_1.EnemyState &&
            this.fuente === "ATAQUE_ENEMIGO") {
            if (danioAlHp > 0) {
                bus.emitir("AL_RECIBIR_DANIO", {
                    state,
                    cola,
                    defensor: this.defensor,
                    atacante: this.atacante,
                    danioRecibido: danioAlHp,
                    fuente: this.fuente
                });
            }
            const espinas = this.defensor.estados.get("ESPINAS") || 0;
            if (espinas > 0 && this.atacante.hp > 0) {
                cola.encolarAlInicio(new AccionAplicarDanio(this.defensor, this.atacante, espinas, "ESPINAS"));
            }
        }
        if (this.atacante instanceof SpireState_1.PlayerState &&
            this.defensor instanceof SpireState_1.EnemyState &&
            this.fuente === "ATAQUE_CARTA" &&
            danioAlHp > 0 &&
            this.defensor.hp > 0) {
            bus.emitir("AL_INFLIGIR_DANIO", {
                state,
                cola,
                atacante: this.atacante,
                defensor: this.defensor,
                danioInfligido: danioAlHp,
                fuente: this.fuente
            });
        }
        if (this.defensor.hp <= 0) {
            cola.encolarAlInicio(new AccionProcesarMuerte(this.defensor, this.atacante));
        }
    }
}
exports.AccionAplicarDanio = AccionAplicarDanio;
class AccionGanarBloqueo {
    constructor(objetivo, valor) {
        this.objetivo = objetivo;
        this.valor = valor;
    }
    ejecutar(_state, cola) {
        if (this.objetivo.hp <= 0 || this.valor <= 0)
            return;
        this.objetivo.bloqueo += this.valor;
        cola.emitirVisual({
            tipo: "BLOQUEO_GANADO",
            entidadId: obtenerIdEntidad(this.objetivo),
            cantidad: this.valor,
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
        this.objetivo.estados.set(this.estadoId, nuevoTotal);
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
        cola.encolarAlFinal(new AccionVerificarFinCombate());
    }
}
exports.AccionProcesarMuerte = AccionProcesarMuerte;
class AccionVerificarFinCombate {
    ejecutar(state, cola, bus) {
        if (state.faseActual !== "COMBAT")
            return;
        const quedaEnemigoVivo = state.enemigos.some((e) => e.hp > 0);
        if (!quedaEnemigoVivo) {
            bus.emitir("AL_FINALIZAR_COMBATE", { state, cola });
            state.faseActual = state.pisoActual >= Mapa_1.CONFIG_MAPA.CANTIDAD_PISOS ? "VICTORY" : "REWARD";
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
