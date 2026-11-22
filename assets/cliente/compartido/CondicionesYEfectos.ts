import { TipoMotivoSeleccionMano } from "./GameTypes";

export type EstadoId =
    | "FUERZA" | "FUERZA_TEMPORAL" | "DESTREZA" | "VULNERABLE" | "DEBIL" | "FRAGIL"
    | "ESPINAS" | "VENENO" | "AVARICIA" | "ARRIESGAR_GANAR" | "SIN_ROBO" | "COMBUSTION"
    | "REFLEJAR" | "ASUSTADIZO" | "ASUSTADIZO_USADO" | "VUELO" | "GOLPES_RECIBIDOS"
    | "RITUAL" | "ENFURECIDO" | "ENTERRADO" | "ATURDIDO" | "PONE_HERIDAS"
    | "GASES_NOCIVOS";

export type TipoObjetivo = "PROPIO" | "ENEMIGO" | "ENEMIGO_ALEATORIO" | "TODOS_ENEMIGOS" | "ALIADO" | "TODOS_ALIADOS" | "ATACANTE";

export type FuenteDanio = "ATAQUE_CARTA" | "ATAQUE_ENEMIGO" | "RELIQUIA" | "ESPINAS" | "VENENO" | "EFECTO_DIRECTO";

export type EncantamientoId = "GRATIS";

export interface IInfoEncantamiento { id: EncantamientoId; nombre: string; descripcion: string; sprite: string; }

export const CATALOGO_ENCANTAMIENTOS: Record<EncantamientoId, IInfoEncantamiento> = {
    GRATIS: { id: "GRATIS", nombre: "Gratis", descripcion: "El costo de energía de esta carta es 0 permanentemente.", sprite: "encantamiento_gratis" }
};

export type DescriptorCondicion =
    | { tipo: "TURNO_MULTIPLO"; divisor: number }
    | { tipo: "TURNO_EXACTO"; turno: number }
    | { tipo: "TURNO_PARIDAD"; esPar: boolean }
    | { tipo: "CARTAS_TURNO_MULTIPLO"; divisor: number }
    | { tipo: "ATAQUES_TURNO_IGUAL"; cantidad: number }
    | { tipo: "DANIO_RECIBIDO_MAYOR_A"; minimo: number }
    | { tipo: "ORO_MINIMO"; minimo: number }
    | { tipo: "ORO_MENOR_A"; maximoExclusivo: number }
    | { tipo: "HP_PORCENTAJE_MENOR_A"; porcentaje: number }
    | { tipo: "ES_COMBATE_JEFE" }
    | { tipo: "CARTA_TIPO_ES"; tipoCarta: "ATAQUE" | "HABILIDAD" | "PODER" | "MALDICION" }
    | { tipo: "TIENE_ESTADO"; objetivo: TipoObjetivo; estadoId: EstadoId; minimo?: number };

// Permite evaluar una cantidad base o leer dinámicamente un estado en pleno combate
export type IValorDinamico = number | {
    tipo: "LEER_ESTADO";
    objetivo: TipoObjetivo;
    estadoId: EstadoId;
    multiplicador: number;
};

export type DescriptorEfecto =
    | {
          tipo: "DANIO";
          valor: IValorDinamico;
          objetivo: TipoObjetivo;
          repeticiones?: number;
          fuente?: FuenteDanio;
          oroPorGolpeAlHp?: number;
          oroSiMata?: number;
          multiplicadorFuerza?: number;
          danioIgualABloqueo?: boolean;
          danioExtraPorAtaqueEnMano?: number;
      }
    | { tipo: "BLOQUEO"; valor: IValorDinamico; objetivo: TipoObjetivo }
    | { tipo: "APLICAR_ESTADO"; estadoId: EstadoId; valor: IValorDinamico; objetivo: TipoObjetivo }
    | { tipo: "CURAR_HP"; valor: IValorDinamico; objetivo: TipoObjetivo }
    | { tipo: "PERDER_HP"; valor: IValorDinamico; objetivo: TipoObjetivo }
    | { tipo: "ROBAR_CARTA"; valor: number; objetivo: "PROPIO" | "ALIADO" | "TODOS_ALIADOS" }
    | { tipo: "GANAR_ENERGIA"; valor: number; objetivo: "PROPIO" | "ALIADO" | "TODOS_ALIADOS" }
    | { tipo: "GANAR_ORO"; valor: number }
    | { tipo: "APUESTA_ORO"; probabilidadExito: number; oroGanado: number; oroPerdido: number }
    | { tipo: "REPARTIR_ORO_ALIADOS"; porcentaje: number }
    | { tipo: "ORO_IGUAL_A_BLOQUEO" }
    | { tipo: "FUERZA_POR_CADA_ORO"; cadaCuantoOro: number; fuerzaGanada: number }
    | { tipo: "BLOQUEO_POR_ORO"; cadaCuantoOro: number; bloqueoPorTramo: number }
    | { tipo: "BLOQUEO_POR_CARTAS_MAZO"; cadaCuantasCartas: number; bloqueoPorTramo: number }
    | { tipo: "ORO_POR_HP_FALTANTE_ENEMIGO"; oroPorHp: number; maximoOro: number; objetivo: "ENEMIGO" }
    | { tipo: "INTERES_ORO"; cadaCuantoOro: number; oroGanado: number }
    | { tipo: "DUPLICAR_ORO" }
    | { tipo: "BLOQUEO_POR_ORO_GASTADO"; maximoOro: number }
    | { tipo: "COPIAR_CARTA_A_DESCARTE"; cartaId: string; cantidad?: number }
    | { tipo: "AGREGAR_CARTA_A_MANO"; cartaId: string; cantidad: number }
    | { tipo: "SELECCIONAR_CARTAS_MANO"; motivo: TipoMotivoSeleccionMano; cantidadMin: number; cantidadMax: number }
    | { tipo: "MEJORAR_CARTAS_MANO"; cantidad: number | "TODAS" }
    | { tipo: "AGOTAR_CARTA_MANO_AZAR"; cantidad: number }
    | { tipo: "HACER_CARTA_MANO_GRATIS_TURNO"; cantidad: number }
    | {
          tipo: "CONDICIONAL";
          condicion: DescriptorCondicion;
          efectosSiCumple: DescriptorEfecto[];
          efectosSiNoCumple?: DescriptorEfecto[];
      };

export type IEfecto = DescriptorEfecto;
export type TipoEfecto = DescriptorEfecto["tipo"];