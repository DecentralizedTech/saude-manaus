export type TipoUnidade = 'HOSPITAL' | 'UPA' | 'SPA' | 'UFS'
export type TipoAtendimento = 'EMERGENCIA_URGENCIA' | 'CONSULTA_ELETIVA' | 'INTERNACAO' | 'EXAMES_PROCEDIMENTOS'

export interface Unidade {
  id: string; nome: string; tipo: TipoUnidade; endereco: string
  bairro: string; zona: string; telefone?: string; ativo: boolean
  lat?: number; lng?: number; particular?: boolean
  scoreGeral: number; scoresPorTipo: Partial<Record<TipoAtendimento, number>>; totalAvaliacoes: number
}

export interface Usuario { id: string; nome: string; email: string; avatar?: string; isAdmin: boolean }

export interface EstatisticasTipo { tipo: TipoAtendimento; label: string; media: number; total: number; min: number; max: number }
export interface EstatisticaParametro { key: string; label: string; percentualPositivo: number; total: number; invertido: boolean }
export interface PontoSerie { semana: string; scoreGeral: number; total: number }
export interface EstatisticasUnidade {
  estatisticas: EstatisticasTipo[]
  parametros: EstatisticaParametro[]
  serieScore: PontoSerie[]
  totalAvaliacoes: number
  scorePublicavel: boolean
}

export const TIPO_UNIDADE_LABEL: Record<TipoUnidade, string> = { HOSPITAL: 'Hospital', UPA: 'UPA', SPA: 'SPA', UFS: 'UFS' }
export const TIPO_ATENDIMENTO_LABEL: Record<TipoAtendimento, string> = {
  EMERGENCIA_URGENCIA: 'Emergência / Urgência', CONSULTA_ELETIVA: 'Consulta Eletiva',
  INTERNACAO: 'Internação', EXAMES_PROCEDIMENTOS: 'Exames e Procedimentos',
}
export const TIPO_UNIDADE_COLOR: Record<TipoUnidade, string> = {
  HOSPITAL: 'bg-red-100 text-red-700', UPA: 'bg-orange-100 text-orange-700', SPA: 'bg-blue-100 text-blue-700', UFS: 'bg-green-100 text-green-700',
}
