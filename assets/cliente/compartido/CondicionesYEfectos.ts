export type EstadoId = "FUERZA" | "VULNERABLE" | "DEBIL" | "ESPINAS" | "VENENO";

export type TipoObjetivo =
    | "PROPIO"
    | "ENEMIGO"
    | "ENEMIGO_ALEATORIO"
    | "TODOS_ENEMIGOS"
    | "ALIADO"
    | "TODOS_ALIADOS"
    | "ATACANTE"; // Nuevo: permite que reliquias defensivas apunten automáticamente al agresor

export type FuenteDanio =
    | "ATAQUE_CARTA"
    | "ATAQUE_ENEMIGO"
    | "RELIQUIA"
    | "ESPINAS"
    | "VENENO"
    | "EFECTO_DIRECTO";

/**
 * Condiciones declarativas puras (serializables y compartibles sin acoplar schemas del servidor).
 */
export type DescriptorCondicion =
    | { tipo: "TURNO_MULTIPLO"; divisor: number }
    | { tipo: "TURNO_EXACTO"; turno: number }
    | { tipo: "TURNO_PARIDAD"; esPar: boolean }
    | { tipo: "CARTAS_TURNO_MULTIPLO"; divisor: number }
    | { tipo: "ATAQUES_TURNO_IGUAL"; cantidad: number }
    | { tipo: "DANIO_RECIBIDO_MAYOR_A"; minimo: number }
    | { tipo: "TIENE_ESTADO"; objetivo: TipoObjetivo; estadoId: EstadoId; minimo?: number };

/**
 * Unión discriminada de efectos: soporta multi-golpe (repeticiones) y efectos condicionales anidados.
 */
export type DescriptorEfecto =
    | {
          tipo: "DANIO";
          valor: number;
          objetivo: TipoObjetivo;
          repeticiones?: number;
          fuente?: FuenteDanio;
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
          tipo: "CONDICIONAL";
          condicion: DescriptorCondicion;
          efectosSiCumple: DescriptorEfecto[];
          efectosSiNoCumple?: DescriptorEfecto[];
      };

// Alias de compatibilidad para el código existente
export type IEfecto = DescriptorEfecto;
export type TipoEfecto = DescriptorEfecto["tipo"];