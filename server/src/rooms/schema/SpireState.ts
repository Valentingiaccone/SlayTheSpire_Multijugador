import { Schema, MapSchema, type, ArraySchema } from "@colyseus/schema";
import { FaseSala, PersonajeId, PERSONAJES_INFO } from "../../../../assets/cliente/compartido/GameTypes";
import { TipoIntencion } from "../../../../assets/cliente/compartido/Enemigos";


export class PlayerState extends Schema {
    @type("string") sessionId: string = "";
    @type("string") nombre: string = "";
    @type("string") personajeId: PersonajeId = "SHELLY";
    @type("boolean") listo: boolean = false;

    // Stats de combate (se inicializan según el personaje elegido)
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

    // Propiedad interna del servidor (sin @type, no hace falta mandarla por red)
    indicePatron: number = 0;
}

export class SpireState extends Schema {
    @type("string") faseActual: FaseSala = "LOBBY";
    @type("number") pisoActual: number = 1;
    @type("number") turnoNumero: number = 1;
    @type({ map: PlayerState }) jugadores = new MapSchema<PlayerState>();
    @type([EnemyState]) enemigos = new ArraySchema<EnemyState>();
}