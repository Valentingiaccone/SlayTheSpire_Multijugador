import { Schema, MapSchema, type, ArraySchema } from "@colyseus/schema";
import { FaseSala, PersonajeId, PERSONAJES_INFO } from "../../../../assets/cliente/compartido/GameTypes";
import { TipoIntencion } from "../../../../assets/cliente/compartido/Enemigos";
import { EstadoNodoMapa, TipoNodoMapa } from "../../../../assets/cliente/compartido/Mapa";

export class MapNodeState extends Schema {
    @type("string") id: string = "";
    @type("number") piso: number = 1;
    @type("number") columna: number = 0;
    @type("string") tipo: TipoNodoMapa = "COMBATE";
    @type("string") estado: EstadoNodoMapa = "BLOQUEADO";
    @type(["string"]) siguientesIds = new ArraySchema<string>();
}

export class PlayerState extends Schema {
    @type("string") sessionId: string = "";
    @type("string") nombre: string = "";
    @type("string") personajeId: PersonajeId = "SHELLY";
    @type("boolean") listo: boolean = false;

    // Nodo del mapa votado actualmente por este jugador ("" = sin voto)
    @type("string") nodoVotadoId: string = "";

    @type("number") hp: number = 80;
    @type("number") hpMax: number = 80;
    @type("number") bloqueo: number = 0;
    @type("number") energia: number = 3;
    @type("number") energiaMax: number = 3;
    @type("boolean") turnoTerminado: boolean = false;

    @type({ map: "number" }) estados = new MapSchema<number>();

    @type(["string"]) mazoMaestro = new ArraySchema<string>();
    @type(["string"]) mano = new ArraySchema<string>();
    @type("number") cantPilaRobo: number = 0;
    @type("number") cantDescarte: number = 0;

    @type(["string"]) opcionesRecompensa = new ArraySchema<string>();
    @type("boolean") recompensaElegida: boolean = false;

    pilaRoboInterna: string[] = [];
    descarteInterno: string[] = [];

    aplicarDatosPersonaje(id: PersonajeId) {
        const info = PERSONAJES_INFO[id];
        if (!info) return;
        this.personajeId = id;
        this.hpMax = info.hpMax;
        this.hp = info.hpMax;
        this.energiaMax = info.energiaMax;
        this.energia = info.energiaMax;
    }
}

export class EnemyState extends Schema {
    @type("string") uid: string = "";
    @type("string") enemigoId: string = "";
    @type("string") nombre: string = "";
    @type("number") hp: number = 30;
    @type("number") hpMax: number = 30;
    @type("number") bloqueo: number = 0;
    @type("string") intencionTipo: TipoIntencion = "ATACAR";
    @type("number") intencionValor: number = 0;

    @type({ map: "number" }) estados = new MapSchema<number>();

    indicePatron: number = 0;
}

export class SpireState extends Schema {
    @type("string") faseActual: FaseSala = "LOBBY";
    @type("number") pisoActual: number = 1;
    @type("number") turnoNumero: number = 1;

    @type({ map: PlayerState }) jugadores = new MapSchema<PlayerState>();
    @type([EnemyState]) enemigos = new ArraySchema<EnemyState>();

    // Estado del Mapa y Votación
    @type([MapNodeState]) nodosMapa = new ArraySchema<MapNodeState>();
    @type("string") nodoActualId: string = "";
    @type("string") nodoGanadorMapaId: string = "";
    @type("number") tiempoCuentaRegresivaMapa: number = 0;
    @type("boolean") hayEmpateMapa: boolean = false;
}