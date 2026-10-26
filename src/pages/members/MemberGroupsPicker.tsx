import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FormField } from "@/components/FormField"
import { X } from "lucide-react"
import type { MemberOption } from "./memberFormFields"

interface MemberGroupsPickerProps {
  value: string[]
  options: MemberOption[]
  disabled?: boolean
  onChange: (groupIds: string[]) => void
}

export function MemberGroupsPicker({ value, options, disabled = false, onChange }: MemberGroupsPickerProps) {
  const labelFor = (id: string) => options.find((option) => option.value === id)?.label ?? id
  const available = options.filter((option) => !value.includes(option.value))

  return (
    <FormField
      label="Social groups"
      required
      hint="The first group is primary and owns the member ID. Adding another group never removes the first."
      className="sm:col-span-2"
    >
      <div className="space-y-2">
        {value.length === 0 ? (
          <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
            Select at least one social group.
          </p>
        ) : (
          <div className="space-y-1.5">
            {value.map((groupId, index) => (
              <div
                key={groupId}
                className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <span className="min-w-0 flex-1 truncate">{labelFor(groupId)}</span>
                {index === 0 && <Badge variant="secondary">Primary</Badge>}
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  disabled={disabled || value.length === 1}
                  aria-label={`Remove ${labelFor(groupId)}`}
                  onClick={() => onChange(value.filter((id) => id !== groupId))}
                >
                  <X />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Select
          value=""
          disabled={disabled || available.length === 0}
          onValueChange={(groupId) => {
            if (groupId && !value.includes(groupId)) onChange([...value, groupId])
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={available.length === 0 ? "All social groups selected" : "Add another social group"}
            />
          </SelectTrigger>
          <SelectContent>
            {available.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </FormField>
  )
}
