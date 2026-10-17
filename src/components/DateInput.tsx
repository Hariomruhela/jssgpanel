import { useEffect, useState } from "react"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DateInputProps {
  /** ISO date (`yyyy-mm-dd`); the value the form stores and the API receives. */
  value: string
  /** Called with an ISO `yyyy-mm-dd` string (or `""` when cleared). */
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  id?: string
  className?: string
}

const ISO = /^(\d{4})-(\d{2})-(\d{2})/

/** `2026-10-17` -> `17/10/2026`. */
function isoToDisplay(iso: string): string {
  const match = ISO.exec(iso)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : ""
}

/** `17/10/2026` -> `2026-10-17`, or `""` when the text is not a real date. */
function displayToIso(display: string): string {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(display)
  if (!match) return ""
  const [, day, month, year] = match
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  const valid =
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day)
  return valid ? `${year}-${month}-${day}` : ""
}

function isoToDate(iso: string): Date | undefined {
  const match = ISO.exec(iso)
  if (!match) return undefined
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
}

/** Keeps the dd/mm/yyyy text in sync while the user types. */
function maskInput(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 8)
  if (digits.length > 4) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
  if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return digits
}

/**
 * A date field that always shows and accepts `dd/mm/yyyy`, while the form keeps
 * the ISO `yyyy-mm-dd` value the API expects. Includes a calendar picker.
 */
export function DateInput({ value, onChange, disabled, placeholder = "dd/mm/yyyy", id, className }: DateInputProps) {
  const [text, setText] = useState(() => isoToDisplay(value))
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setText(isoToDisplay(value))
  }, [value])

  const handleText = (input: string) => {
    const masked = maskInput(input)
    setText(masked)
    if (masked.length === 0) {
      onChange("")
      return
    }
    if (masked.length === 10) {
      const iso = displayToIso(masked)
      if (iso) onChange(iso)
    }
  }

  const handleBlur = () => {
    const iso = text ? displayToIso(text) : ""
    if (iso) onChange(iso)
    else if (!text) onChange("")
    setText(isoToDisplay(iso))
  }

  const pick = (date: Date | undefined) => {
    if (!date) return
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    onChange(iso)
    setText(isoToDisplay(iso))
    setOpen(false)
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Input
        id={id}
        value={text}
        disabled={disabled}
        placeholder={placeholder}
        inputMode="numeric"
        autoComplete="off"
        onChange={(e) => handleText(e.target.value)}
        onBlur={handleBlur}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="icon" disabled={disabled} aria-label="Pick a date">
            <CalendarIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-0">
          <Calendar mode="single" selected={isoToDate(value)} defaultMonth={isoToDate(value)} onSelect={pick} />
        </PopoverContent>
      </Popover>
    </div>
  )
}
