export const FRANJAS_ESTANDAR = ["0-2", "3-5", "6-8", "9-12", "13-16", "17-20"] as const;
export type FranjaEtaria = typeof FRANJAS_ESTANDAR[number];
