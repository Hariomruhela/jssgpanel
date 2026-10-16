import { createContext, useContext } from "react"

export type LabelParams = Record<string, string | number>

/** Replace `{name}` placeholders in a template. Unknown params are left intact. */
export function formatTemplate(template: string, params?: LabelParams): string {
  if (!template || !params) return template
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = params[key]
    return value === undefined || value === null ? match : String(value)
  })
}

/** Translate a label outside React. English-only, so it just interpolates params. */
export function translate(label: string, params?: LabelParams): string {
  return formatTemplate(label, params)
}

export interface LanguageContextValue {
  /** Translate a known UI label with optional `{param}` interpolation. */
  t: (label: string, params?: LabelParams) => string
  /** Translate a singular/plural label, injecting `{n}`. */
  tn: (singular: string, plural: string, count: number, params?: LabelParams) => string
  /** Value display passthrough. */
  h: (value: string | null | undefined) => string | null | undefined
}

const defaultValue: LanguageContextValue = {
  t: (label, params) => formatTemplate(label, params),
  tn: (singular, plural, count, params) =>
    formatTemplate(count === 1 ? singular : plural, { n: count, ...params }),
  h: (value) => value,
}

const LanguageContext = createContext<LanguageContextValue>(defaultValue)

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext)
}
