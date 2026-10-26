import { FormField } from "@/components/FormField"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { DateInput } from "@/components/DateInput"
import type { FieldSection, MemberFormState } from "./memberFormFields"

interface MemberFieldGridProps {
  sections: FieldSection<string>[]
  values: MemberFormState
  onChange: (key: string, value: string) => void
  disabled?: boolean
}

export function MemberFieldGrid({ sections, values, onChange, disabled = false }: MemberFieldGridProps) {
  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <div key={section.id} className="space-y-3">
          <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{section.label}</h4>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {section.fields.map((field) => {
              const value = values[field.key as keyof MemberFormState] ?? ""
              const gridClass = field.full ? "sm:col-span-2" : ""

              if (field.type === "select") {
                return (
                  <FormField key={field.key} label={field.label} required={field.required} className={gridClass}>
                    <Select
                      value={value || undefined}
                      disabled={disabled}
                      onValueChange={(v) => onChange(field.key, v === "__none__" ? "" : v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={field.required ? `Select ${field.label.toLowerCase()}` : "Not set"}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {!field.required && <SelectItem value="__none__">Not set</SelectItem>}
                        {(field.options ?? []).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                )
              }

              if (field.type === "textarea") {
                return (
                  <FormField
                    key={field.key}
                    label={field.label}
                    required={field.required}
                    hint={field.hint}
                    className={gridClass}
                  >
                    <Textarea
                      rows={2}
                      value={value}
                      disabled={disabled}
                      placeholder={field.placeholder}
                      onChange={(e) => onChange(field.key, e.target.value)}
                    />
                  </FormField>
                )
              }

              if (field.type === "date") {
                return (
                  <FormField
                    key={field.key}
                    label={field.label}
                    required={field.required}
                    hint={field.hint}
                    className={gridClass}
                  >
                    <DateInput value={value} disabled={disabled} onChange={(v) => onChange(field.key, v)} />
                  </FormField>
                )
              }

              return (
                <FormField
                  key={field.key}
                  label={field.label}
                  required={field.required}
                  hint={field.hint}
                  className={gridClass}
                >
                  <Input
                    type={field.type}
                    value={value}
                    disabled={disabled}
                    placeholder={field.placeholder}
                    onChange={(e) => onChange(field.key, e.target.value)}
                  />
                </FormField>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
