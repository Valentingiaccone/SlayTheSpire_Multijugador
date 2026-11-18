export type EstadoId =
    | "FUERZA"
    | "VULNERABLE"
    | "DEBIL"
    | "ESPINAS"
    | "VENENO"
    | "AVARICIA"
    | "ARRIESGAR_GANAR";

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

export type DescriptorCondicion =
    | { tipo: "TURNO_MULTIPLO"; divisor: number }
    | { tipo: "TURNO_EXACTO"; turno: number }
    | { tipo: "TURNO_PARIDAD"; esPar: boolean }
    | { tipo: "CARTAS_TURNO_MULTIPLO"; divisor: number }
    | { tipo: "ATAQUES_TURNO_IGUAL"; cantidad: number }
    | { tipo: "DANIO_RECIBIDO_MAYOR_A"; minimo: number }
    | { tipo: "ORO_MINIMO"; minimo: number }
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
      }
    | {
          tipo: "ROBAR_CARTA";
          valor: number;
          objetivo: "PROPIO" | "ALIADO" | "TODOS_ALIADOS";
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
          tipo: "CONDICIONAL";
          condicion: DescriptorCondicion;
          efectosSiCumple: DescriptorEfecto[];
          efectosSiNoCumple?: DescriptorEfecto[];
      };

export type IEfecto = DescriptorEfecto;
export type TipoEfecto = DescriptorEfecto["tipo"];