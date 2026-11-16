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

    // Reliquias que posee el jugador
    @type(["string"]) reliquias = new ArraySchema<string>();

    // Recompensas post-combate
    @type(["string"]) opcionesRecompensa = new ArraySchema<string>();
    @type("string") reliquiaRecompensa: string = ""; // Se llena al vencer un Élite
    @type("boolean") recompensaElegida: boolean = false;

    // Elección actual en un evento de Cofre
    @type("string") reliquiaCofreVotadaId: string = "";

    // Variables internas del servidor para evaluar triggers de reliquias
    pilaRoboInterna: string[] = [];
    descarteInterno: string[] = [];
    cartasJugadasTurno: number = 0;
    ataquesJugadosTurno: number = 0;
    cartasJugadasCombate: number = 0;

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
    @type("boolean") esCombateElite: boolean = false;
    @type("boolean") esCombateJefe: boolean = false;

    @type({ map: PlayerState }) jugadores = new MapSchema<PlayerState>();
    @type([EnemyState]) enemigos = new ArraySchema<EnemyState>();

    // Mapa
    @type([MapNodeState]) nodosMapa = new ArraySchema<MapNodeState>();
    @type("string") nodoActualId: string = "";
    @type("string") nodoGanadorMapaId: string = "";
    @type("number") tiempoCuentaRegresivaMapa: number = 0;
    @type("boolean") hayEmpateMapa: boolean = false;

    // Evento Cofre
    @type("boolean") cofreAbierto: boolean = false;
    @type(["string"]) reliquiasCofre = new ArraySchema<string>();
    @type("number") tiempoCuentaRegresivaCofre: number = 0;
    @type("boolean") hayConflictoCofre: boolean = false;
}