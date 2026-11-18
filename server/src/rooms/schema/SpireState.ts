import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";
import {
    FaseSala,
    PersonajeId,
    PERSONAJES_INFO,
    ECONOMIA_CONFIG
} from "../../../../assets/cliente/compartido/GameTypes";
import { EstadoNodoMapa, TipoNodoMapa } from "../../../../assets/cliente/compartido/Mapa";
import { TipoIntencion } from "../../../../assets/cliente/compartido/Enemigos";

export class MapNodeState extends Schema {
    @type("string") id: string = "";
    @type("number") piso: number = 1;
    @type("number") columna: number = 0;
    @type("string") tipo: TipoNodoMapa = "COMBATE";
    @type("string") estado: EstadoNodoMapa = "BLOQUEADO";
    @type(["string"]) siguientesIds = new ArraySchema<string>();

    tipoRealOculto?: TipoNodoMapa;
}

export class EnemyState extends Schema {
    @type("string") uid: string = "";
    @type("string") enemigoId: string = "";
    @type("string") nombre: string = "";
    @type("number") hp: number = 0;
    @type("number") hpMax: number = 0;
    @type("number") bloqueo: number = 0;
    @type("number") intencionValor: number = 0;
    @type("string") intencionTipo: TipoIntencion = "ATACAR";
    @type({ map: "number" }) estados = new MapSchema<number>();

    indicePatron: number = 0;
}

export class PlayerState extends Schema {
    @type("string") sessionId: string = "";
    @type("string") nombre: string = "";
    @type("string") personajeId: PersonajeId = "SHELLY";
    @type("boolean") listo: boolean = false;

    @type("number") hp: number = 80;
    @type("number") hpMax: number = 80;
    @type("number") bloqueo: number = 0;
    @type("number") energia: number = 3;
    @type("number") energiaMax: number = 3;
    @type("number") oro: number = ECONOMIA_CONFIG.ORO_INICIAL;
    @type("number") hpPerdidoCombate: number = 0;

    @type("boolean") turnoTerminado: boolean = false;
    @type("string") nodoVotadoId: string = "";
    @type("string") reliquiaCofreVotadaId: string = "";

    @type("boolean") recompensaElegida: boolean = false;
    @type(["string"]) opcionesRecompensa = new ArraySchema<string>();
    @type("string") reliquiaRecompensa: string = "";
    @type("number") oroRecompensa: number = 0;

    @type("boolean") fogataCompletada: boolean = false;
    @type("boolean") tiendaCompletada: boolean = false;
    @type("boolean") tiendaEliminacionUsada: boolean = false;
    @type(["string"]) tiendaCartas = new ArraySchema<string>();
    @type(["string"]) tiendaReliquias = new ArraySchema<string>();

    @type("boolean") eventoCompletado: boolean = false;
    @type("number") eventoVotoOpcion: number = -1;
    @type(["string"]) eventoOpcionCartas = new ArraySchema<string>();
    @type(["string"]) eventoOpcionReliquias = new ArraySchema<string>();
    @type(["string"]) eventoOpcionMaldiciones = new ArraySchema<string>();

    @type(["string"]) mano = new ArraySchema<string>();
    @type(["string"]) mazoMaestro = new ArraySchema<string>();
    @type(["string"]) pilaRobo = new ArraySchema<string>();
    @type(["string"]) descarte = new ArraySchema<string>();
    @type(["string"]) agotadas = new ArraySchema<string>();
    @type(["string"]) reliquias = new ArraySchema<string>();
    @type({ map: "number" }) estados = new MapSchema<number>();

    @type("number") cantPilaRobo: number = 0;
    @type("number") cantDescarte: number = 0;
    @type("number") cantAgotadas: number = 0;

    pilaRoboInterna: string[] = [];
    descarteInterno: string[] = [];
    agotadasInterno: string[] = [];
    cartasJugadasTurno: number = 0;
    ataquesJugadosTurno: number = 0;
    cartasJugadasCombate: number = 0;

    public aplicarDatosPersonaje(personajeId: PersonajeId) {
        const info = PERSONAJES_INFO[personajeId];
        if (!info) return;
        this.personajeId = personajeId;
        this.hpMax = info.hpMax;
        this.hp = info.hpMax;
        this.energiaMax = info.energiaMax;
        this.energia = info.energiaMax;
        this.oro = info.oroInicial ?? ECONOMIA_CONFIG.ORO_INICIAL;
        this.bloqueo = 0;
    }
}

export class SpireState extends Schema {
    @type("string") faseActual: FaseSala = "LOBBY";
    @type("number") pisoActual: number = 1;
    @type("number") turnoNumero: number = 1;
    @type("string") nodoActualId: string = "";

    @type("string") nodoGanadorMapaId: string = "";
    @type("number") tiempoCuentaRegresivaMapa: number = 0;
    @type("boolean") hayEmpateMapa: boolean = false;

    @type("boolean") esCombateElite: boolean = false;
    @type("boolean") esCombateJefe: boolean = false;

    @type("boolean") cofreAbierto: boolean = false;
    @type("boolean") hayConflictoCofre: boolean = false;
    @type("number") tiempoCuentaRegresivaCofre: number = 0;
    @type(["string"]) reliquiasCofre = new ArraySchema<string>();

    @type("string") eventoActualId: string = "";
    @type("boolean") hayEmpateEvento: boolean = false;
    @type("number") opcionGanadoraEventoIdx: number = -1;
    @type("number") tiempoCuentaRegresivaEvento: number = 0;

    @type({ map: PlayerState }) jugadores = new MapSchema<PlayerState>();
    @type([EnemyState]) enemigos = new ArraySchema<EnemyState>();
    @type([MapNodeState]) nodosMapa = new ArraySchema<MapNodeState>();
}