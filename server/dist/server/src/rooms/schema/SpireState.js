"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpireState = exports.PlayerState = exports.EnemyState = exports.MapNodeState = void 0;
const schema_1 = require("@colyseus/schema");
const GameTypes_1 = require("../../../../assets/cliente/compartido/GameTypes");
class MapNodeState extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.id = "";
        this.piso = 1;
        this.columna = 0;
        this.tipo = "COMBATE";
        this.estado = "BLOQUEADO";
        this.siguientesIds = new schema_1.ArraySchema();
    }
}
exports.MapNodeState = MapNodeState;
__decorate([
    (0, schema_1.type)("string")
], MapNodeState.prototype, "id", void 0);
__decorate([
    (0, schema_1.type)("number")
], MapNodeState.prototype, "piso", void 0);
__decorate([
    (0, schema_1.type)("number")
], MapNodeState.prototype, "columna", void 0);
__decorate([
    (0, schema_1.type)("string")
], MapNodeState.prototype, "tipo", void 0);
__decorate([
    (0, schema_1.type)("string")
], MapNodeState.prototype, "estado", void 0);
__decorate([
    (0, schema_1.type)(["string"])
], MapNodeState.prototype, "siguientesIds", void 0);
class EnemyState extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.uid = "";
        this.enemigoId = "";
        this.nombre = "";
        this.hp = 0;
        this.hpMax = 0;
        this.bloqueo = 0;
        this.intencionValor = 0;
        this.intencionTipo = "ATACAR";
        this.estados = new schema_1.MapSchema();
        this.indicePatron = 0;
    }
}
exports.EnemyState = EnemyState;
__decorate([
    (0, schema_1.type)("string")
], EnemyState.prototype, "uid", void 0);
__decorate([
    (0, schema_1.type)("string")
], EnemyState.prototype, "enemigoId", void 0);
__decorate([
    (0, schema_1.type)("string")
], EnemyState.prototype, "nombre", void 0);
__decorate([
    (0, schema_1.type)("number")
], EnemyState.prototype, "hp", void 0);
__decorate([
    (0, schema_1.type)("number")
], EnemyState.prototype, "hpMax", void 0);
__decorate([
    (0, schema_1.type)("number")
], EnemyState.prototype, "bloqueo", void 0);
__decorate([
    (0, schema_1.type)("number")
], EnemyState.prototype, "intencionValor", void 0);
__decorate([
    (0, schema_1.type)("string")
], EnemyState.prototype, "intencionTipo", void 0);
__decorate([
    (0, schema_1.type)({ map: "number" })
], EnemyState.prototype, "estados", void 0);
class PlayerState extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.sessionId = "";
        this.nombre = "";
        this.personajeId = "SHELLY";
        this.listo = false;
        this.hp = 80;
        this.hpMax = 80;
        this.bloqueo = 0;
        this.energia = 3;
        this.energiaMax = 3;
        this.oro = GameTypes_1.ECONOMIA_CONFIG.ORO_INICIAL;
        this.turnoTerminado = false;
        this.nodoVotadoId = "";
        this.reliquiaCofreVotadaId = "";
        // Recompensas post-combate
        this.recompensaElegida = false;
        this.opcionesRecompensa = new schema_1.ArraySchema();
        this.reliquiaRecompensa = "";
        this.oroRecompensa = 0;
        // Estado en Fogata y Tienda
        this.fogataCompletada = false;
        this.tiendaCompletada = false;
        this.tiendaEliminacionUsada = false;
        this.tiendaCartas = new schema_1.ArraySchema();
        this.tiendaReliquias = new schema_1.ArraySchema();
        // Cartas y Reliquias
        this.mano = new schema_1.ArraySchema();
        this.mazoMaestro = new schema_1.ArraySchema();
        this.reliquias = new schema_1.ArraySchema();
        this.estados = new schema_1.MapSchema();
        this.cantPilaRobo = 0;
        this.cantDescarte = 0;
        // Variables internas de servidor
        this.pilaRoboInterna = [];
        this.descarteInterno = [];
        this.cartasJugadasTurno = 0;
        this.ataquesJugadosTurno = 0;
        this.cartasJugadasCombate = 0;
    }
    aplicarDatosPersonaje(personajeId) {
        const info = GameTypes_1.PERSONAJES_INFO[personajeId];
        if (!info)
            return;
        this.personajeId = personajeId;
        this.hpMax = info.hpMax;
        this.hp = info.hpMax;
        this.energiaMax = info.energiaMax;
        this.energia = info.energiaMax;
        this.oro = info.oroInicial ?? GameTypes_1.ECONOMIA_CONFIG.ORO_INICIAL;
        this.bloqueo = 0;
    }
}
exports.PlayerState = PlayerState;
__decorate([
    (0, schema_1.type)("string")
], PlayerState.prototype, "sessionId", void 0);
__decorate([
    (0, schema_1.type)("string")
], PlayerState.prototype, "nombre", void 0);
__decorate([
    (0, schema_1.type)("string")
], PlayerState.prototype, "personajeId", void 0);
__decorate([
    (0, schema_1.type)("boolean")
], PlayerState.prototype, "listo", void 0);
__decorate([
    (0, schema_1.type)("number")
], PlayerState.prototype, "hp", void 0);
__decorate([
    (0, schema_1.type)("number")
], PlayerState.prototype, "hpMax", void 0);
__decorate([
    (0, schema_1.type)("number")
], PlayerState.prototype, "bloqueo", void 0);
__decorate([
    (0, schema_1.type)("number")
], PlayerState.prototype, "energia", void 0);
__decorate([
    (0, schema_1.type)("number")
], PlayerState.prototype, "energiaMax", void 0);
__decorate([
    (0, schema_1.type)("number")
], PlayerState.prototype, "oro", void 0);
__decorate([
    (0, schema_1.type)("boolean")
], PlayerState.prototype, "turnoTerminado", void 0);
__decorate([
    (0, schema_1.type)("string")
], PlayerState.prototype, "nodoVotadoId", void 0);
__decorate([
    (0, schema_1.type)("string")
], PlayerState.prototype, "reliquiaCofreVotadaId", void 0);
__decorate([
    (0, schema_1.type)("boolean")
], PlayerState.prototype, "recompensaElegida", void 0);
__decorate([
    (0, schema_1.type)(["string"])
], PlayerState.prototype, "opcionesRecompensa", void 0);
__decorate([
    (0, schema_1.type)("string")
], PlayerState.prototype, "reliquiaRecompensa", void 0);
__decorate([
    (0, schema_1.type)("number")
], PlayerState.prototype, "oroRecompensa", void 0);
__decorate([
    (0, schema_1.type)("boolean")
], PlayerState.prototype, "fogataCompletada", void 0);
__decorate([
    (0, schema_1.type)("boolean")
], PlayerState.prototype, "tiendaCompletada", void 0);
__decorate([
    (0, schema_1.type)("boolean")
], PlayerState.prototype, "tiendaEliminacionUsada", void 0);
__decorate([
    (0, schema_1.type)(["string"])
], PlayerState.prototype, "tiendaCartas", void 0);
__decorate([
    (0, schema_1.type)(["string"])
], PlayerState.prototype, "tiendaReliquias", void 0);
__decorate([
    (0, schema_1.type)(["string"])
], PlayerState.prototype, "mano", void 0);
__decorate([
    (0, schema_1.type)(["string"])
], PlayerState.prototype, "mazoMaestro", void 0);
__decorate([
    (0, schema_1.type)(["string"])
], PlayerState.prototype, "reliquias", void 0);
__decorate([
    (0, schema_1.type)({ map: "number" })
], PlayerState.prototype, "estados", void 0);
__decorate([
    (0, schema_1.type)("number")
], PlayerState.prototype, "cantPilaRobo", void 0);
__decorate([
    (0, schema_1.type)("number")
], PlayerState.prototype, "cantDescarte", void 0);
class SpireState extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.faseActual = "LOBBY";
        this.pisoActual = 1;
        this.turnoNumero = 1;
        this.nodoActualId = "";
        this.nodoGanadorMapaId = "";
        this.tiempoCuentaRegresivaMapa = 0;
        this.hayEmpateMapa = false;
        this.esCombateElite = false;
        this.esCombateJefe = false;
        this.cofreAbierto = false;
        this.hayConflictoCofre = false;
        this.tiempoCuentaRegresivaCofre = 0;
        this.reliquiasCofre = new schema_1.ArraySchema();
        this.jugadores = new schema_1.MapSchema();
        this.enemigos = new schema_1.ArraySchema();
        this.nodosMapa = new schema_1.ArraySchema();
    }
}
exports.SpireState = SpireState;
__decorate([
    (0, schema_1.type)("string")
], SpireState.prototype, "faseActual", void 0);
__decorate([
    (0, schema_1.type)("number")
], SpireState.prototype, "pisoActual", void 0);
__decorate([
    (0, schema_1.type)("number")
], SpireState.prototype, "turnoNumero", void 0);
__decorate([
    (0, schema_1.type)("string")
], SpireState.prototype, "nodoActualId", void 0);
__decorate([
    (0, schema_1.type)("string")
], SpireState.prototype, "nodoGanadorMapaId", void 0);
__decorate([
    (0, schema_1.type)("number")
], SpireState.prototype, "tiempoCuentaRegresivaMapa", void 0);
__decorate([
    (0, schema_1.type)("boolean")
], SpireState.prototype, "hayEmpateMapa", void 0);
__decorate([
    (0, schema_1.type)("boolean")
], SpireState.prototype, "esCombateElite", void 0);
__decorate([
    (0, schema_1.type)("boolean")
], SpireState.prototype, "esCombateJefe", void 0);
__decorate([
    (0, schema_1.type)("boolean")
], SpireState.prototype, "cofreAbierto", void 0);
__decorate([
    (0, schema_1.type)("boolean")
], SpireState.prototype, "hayConflictoCofre", void 0);
__decorate([
    (0, schema_1.type)("number")
], SpireState.prototype, "tiempoCuentaRegresivaCofre", void 0);
__decorate([
    (0, schema_1.type)(["string"])
], SpireState.prototype, "reliquiasCofre", void 0);
__decorate([
    (0, schema_1.type)({ map: PlayerState })
], SpireState.prototype, "jugadores", void 0);
__decorate([
    (0, schema_1.type)([EnemyState])
], SpireState.prototype, "enemigos", void 0);
__decorate([
    (0, schema_1.type)([MapNodeState])
], SpireState.prototype, "nodosMapa", void 0);
