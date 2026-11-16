"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpireState = exports.EnemyState = exports.PlayerState = exports.MapNodeState = void 0;
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
class PlayerState extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.sessionId = "";
        this.nombre = "";
        this.personajeId = "SHELLY";
        this.listo = false;
        // Nodo del mapa votado actualmente por este jugador ("" = sin voto)
        this.nodoVotadoId = "";
        this.hp = 80;
        this.hpMax = 80;
        this.bloqueo = 0;
        this.energia = 3;
        this.energiaMax = 3;
        this.turnoTerminado = false;
        this.estados = new schema_1.MapSchema();
        this.mazoMaestro = new schema_1.ArraySchema();
        this.mano = new schema_1.ArraySchema();
        this.cantPilaRobo = 0;
        this.cantDescarte = 0;
        this.opcionesRecompensa = new schema_1.ArraySchema();
        this.recompensaElegida = false;
        this.pilaRoboInterna = [];
        this.descarteInterno = [];
    }
    aplicarDatosPersonaje(id) {
        const info = GameTypes_1.PERSONAJES_INFO[id];
        if (!info)
            return;
        this.personajeId = id;
        this.hpMax = info.hpMax;
        this.hp = info.hpMax;
        this.energiaMax = info.energiaMax;
        this.energia = info.energiaMax;
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
    (0, schema_1.type)("string")
], PlayerState.prototype, "nodoVotadoId", void 0);
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
    (0, schema_1.type)("boolean")
], PlayerState.prototype, "turnoTerminado", void 0);
__decorate([
    (0, schema_1.type)({ map: "number" })
], PlayerState.prototype, "estados", void 0);
__decorate([
    (0, schema_1.type)(["string"])
], PlayerState.prototype, "mazoMaestro", void 0);
__decorate([
    (0, schema_1.type)(["string"])
], PlayerState.prototype, "mano", void 0);
__decorate([
    (0, schema_1.type)("number")
], PlayerState.prototype, "cantPilaRobo", void 0);
__decorate([
    (0, schema_1.type)("number")
], PlayerState.prototype, "cantDescarte", void 0);
__decorate([
    (0, schema_1.type)(["string"])
], PlayerState.prototype, "opcionesRecompensa", void 0);
__decorate([
    (0, schema_1.type)("boolean")
], PlayerState.prototype, "recompensaElegida", void 0);
class EnemyState extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.uid = "";
        this.enemigoId = "";
        this.nombre = "";
        this.hp = 30;
        this.hpMax = 30;
        this.bloqueo = 0;
        this.intencionTipo = "ATACAR";
        this.intencionValor = 0;
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
    (0, schema_1.type)("string")
], EnemyState.prototype, "intencionTipo", void 0);
__decorate([
    (0, schema_1.type)("number")
], EnemyState.prototype, "intencionValor", void 0);
__decorate([
    (0, schema_1.type)({ map: "number" })
], EnemyState.prototype, "estados", void 0);
class SpireState extends schema_1.Schema {
    constructor() {
        super(...arguments);
        this.faseActual = "LOBBY";
        this.pisoActual = 1;
        this.turnoNumero = 1;
        this.jugadores = new schema_1.MapSchema();
        this.enemigos = new schema_1.ArraySchema();
        // Estado del Mapa y Votación
        this.nodosMapa = new schema_1.ArraySchema();
        this.nodoActualId = "";
        this.nodoGanadorMapaId = "";
        this.tiempoCuentaRegresivaMapa = 0;
        this.hayEmpateMapa = false;
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
    (0, schema_1.type)({ map: PlayerState })
], SpireState.prototype, "jugadores", void 0);
__decorate([
    (0, schema_1.type)([EnemyState])
], SpireState.prototype, "enemigos", void 0);
__decorate([
    (0, schema_1.type)([MapNodeState])
], SpireState.prototype, "nodosMapa", void 0);
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
