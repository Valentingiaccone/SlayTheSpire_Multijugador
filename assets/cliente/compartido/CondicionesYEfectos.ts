export type EstadoId =
    | "FUERZA"
    | "FUERZA_TEMPORAL"
    | "DESTREZA"
    | "VULNERABLE"
    | "DEBIL"
    | "ESPINAS"
    | "VENENO"
    | "AVARICIA"
    | "ARRIESGAR_GANAR"
    | "SIN_ROBO"
    | "COMBUSTION"
    | "MANTENER_BLOQUEO"
    | "BLOQUEO_SIGUIENTE_TURNO"
    | "ENERGIA_SIGUIENTE_TURNO"
    | "PRECISION_DAGAS"
    | "RECUPERAR_FUERZA";

export type TipoObjetivo =
    | "PROPIO"
    | "ENEMIGO"
    | "ENEMIGO_ALEATORIO"
    | "TODOS_ENEMIGOS"
    | "ALIADO"
    | "TODOS_ALIADOS"
    | "ATACANTE";

export type FuenteDanio =
    | "ATAQUE_CARTA"
    | "ATAQUE_ENEMIGO"
    | "RELIQUIA"
    | "ESPINAS"
    | "VENENO"
    | "EFECTO_DIRECTO";

export type EncantamientoId = "GRATIS";

export type TipoAccionSeleccionMano = "DESCARTAR" | "AGOTAR" | "MEJORAR" | "HACER_GRATIS";

export interface IInfoEncantamiento {
    id: EncantamientoId;
    nombre: string;
    descripcion: string;
    sprite: string;
}

export const CATALOGO_ENCANTAMIENTOS: Record<EncantamientoId, IInfoEncantamiento> = {
    GRATIS: {
        id: "GRATIS",
        nombre: "Gratis",
        descripcion: "El costo de energía de esta carta es 0 permanentemente.",
        sprite: "encantamiento_gratis"
    }
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
    | { tipo: "DESCARTO_EN_TURNO" }
    | { tipo: "TIENE_ESTADO"; objetivo: TipoObjetivo; estadoId: EstadoId; minimo?: number };

export type DescriptorEfecto =
    | {
          tipo: "DANIO";
          valor: number;
          objetivo: TipoObjetivo;
          repeticiones?: number;
          fuente?: FuenteDanio;
          oroPorGolpeAlHp?: number;
          oroSiMata?: number;
          multiplicadorFuerza?: number;
          danioIgualABloqueo?: boolean;
          danioExtraPorAtaqueEnMano?: number;
          esDaga?: boolean;
      }
    | {
          tipo: "BLOQUEO";
          valor: number;
          objetivo: TipoObjetivo;
      }
    | {
          tipo: "APLICAR_ESTADO";
          estadoId: EstadoId;
          valor: number;
          objetivo: TipoObjetivo;
          repeticiones?: number;
      }
    | {
          tipo: "REDUCIR_FUERZA_TEMPORAL";
          valor: number;
          objetivo: TipoObjetivo;
      }
    | {
          tipo: "MULTIPLICAR_ESTADO";
          estadoId: EstadoId;
          multiplicador: number;
          objetivo: TipoObjetivo;
      }
    | {
          tipo: "ROBAR_CARTA";
          valor: number;
          objetivo: "PROPIO" | "ALIADO" | "TODOS_ALIADOS";
      }
    | {
          tipo: "AGREGAR_CARTA_A_MANO";
          cartaId: string;
          cantidad: number;
      }
    | {
          tipo: "AGREGAR_PODER_ALEATORIO_GRATIS_MANO";
          cantidad?: number;
      }
    | {
          tipo: "DESCARTAR_CARTA_MANO_AZAR";
          cantidad: number;
      }
    | {
          tipo: "DESCARTAR_TODA_LA_MANO_Y_ROBAR";
      }
    | {
          tipo: "SELECCIONAR_CARTAS_MANO";
          accion: TipoAccionSeleccionMano;
          cantidad: number;
          efectosAlCompletar?: DescriptorEfecto[];
      }
    | {
          tipo: "GANAR_ENERGIA";
          valor: number;
          objetivo: "PROPIO" | "ALIADO" | "TODOS_ALIADOS";
      }
    | {
          tipo: "CURAR_HP";
          valor: number;
          objetivo: TipoObjetivo;
      }
    | {
          tipo: "PERDER_HP";
          valor: number;
          objetivo: TipoObjetivo;
      }
    | {
          tipo: "GANAR_ORO";
          valor: number;
      }
    | {
          tipo: "APUESTA_ORO";
          probabilidadExito: number;
          oroGanado: number;
          oroPerdido: number;
      }
    | {
          tipo: "REPARTIR_ORO_ALIADOS";
          porcentaje: number;
      }
    | {
          tipo: "ORO_IGUAL_A_BLOQUEO";
      }
    | {
          tipo: "FUERZA_POR_CADA_ORO";
          cadaCuantoOro: number;
          fuerzaGanada: number;
      }
    | {
          tipo: "BLOQUEO_POR_ORO";
          cadaCuantoOro: number;
          bloqueoPorTramo: number;
      }
    | {
          tipo: "BLOQUEO_POR_CARTAS_MAZO";
          cadaCuantasCartas: number;
          bloqueoPorTramo: number;
      }
    | {
          tipo: "HACER_CARTA_MANO_GRATIS_TURNO";
          cantidad: number;
      }
    | {
          tipo: "ORO_POR_HP_FALTANTE_ENEMIGO";
          oroPorHp: number;
          maximoOro: number;
          objetivo: "ENEMIGO";
      }
    | {
          tipo: "INTERES_ORO";
          cadaCuantoOro: number;
          oroGanado: number;
      }
    | {
          tipo: "DUPLICAR_ORO";
      }
    | {
          tipo: "BLOQUEO_POR_ORO_GASTADO";
          maximoOro: number;
      }
    | {
          tipo: "COPIAR_CARTA_A_DESCARTE";
          cartaId: string;
          cantidad?: number;
      }
    | {
          tipo: "MEJORAR_CARTAS_MANO";
          cantidad: number | "TODAS";
      }
    | {
          tipo: "AGOTAR_CARTA_MANO_AZAR";
          cantidad: number;
      }
    | {
          tipo: "CONDICIONAL";
          condicion: DescriptorCondicion;
          efectosSiCumple: DescriptorEfecto[];
          efectosSiNoCumple?: DescriptorEfecto[];
      };

export type IEfecto = DescriptorEfecto;
export type TipoEfecto = DescriptorEfecto["tipo"];