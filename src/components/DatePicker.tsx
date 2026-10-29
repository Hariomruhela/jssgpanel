import * as React from "react"
import { CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

const ISO_REGEX = /^(\d{4})-(\d{2})-(\d{2})/
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]
const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
]
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

function isoToDisplay(iso: string | null | undefined): string {
  if (!iso) return ""
  const match = ISO_REGEX.exec(iso)
  return match ? `${match[3]}/${match[2]}/${match[1]}` : ""
}

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

function parseToDate(val: string | Date | null | undefined): Date | undefined {
  if (!val) return undefined
  if (val instanceof Date) return isNaN(val.getTime()) ? undefined : val
  const match = ISO_REGEX.exec(val)
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  }
  const iso = displayToIso(val)
  if (iso) {
    const m = ISO_REGEX.exec(iso)
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  }
  return undefined
}

function dateToIso(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function maskInput(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 8)
  if (digits.length > 4) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
  if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return digits
}

export interface CalendarProps {
  selected?: Date | string | null
  defaultMonth?: Date
  onSelect?: (date: Date) => void
  onClear?: () => void
  mode?: "single"
  minYear?: number
  maxYear?: number
  isDob?: boolean
  clearable?: boolean
  className?: string
}

/**
 * Modern, responsive inline Calendar component with cream/gold styling,
 * clickable Month and Year navigation, and fast Year -> Month -> Date selection.
 */
export function Calendar({
  selected,
  defaultMonth,
  onSelect,
  onClear,
  minYear = 1900,
  maxYear,
  isDob = false,
  clearable = true,
  className,
}: CalendarProps) {
  const currentYear = new Date().getFullYear()
  const effectiveMaxYear = maxYear ?? (isDob ? currentYear : currentYear + 20)
  const effectiveMinYear = Math.min(minYear, effectiveMaxYear)

  const selectedDate = parseToDate(selected)
  const [viewDate, setViewDate] = React.useState<Date>(
    () => selectedDate ?? defaultMonth ?? new Date()
  )
  const [viewMode, setViewMode] = React.useState<"day" | "month" | "year">("day")

  const yearListRef = React.useRef<HTMLDivElement>(null)
  const selectedYearRef = React.useRef<HTMLButtonElement>(null)

  React.useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate)
    }
  }, [selectedDate])

  React.useEffect(() => {
    if (viewMode === "year" && selectedYearRef.current) {
      selectedYearRef.current.scrollIntoView({ block: "center", behavior: "auto" })
    }
  }, [viewMode])

  const selectDate = (date: Date) => {
    setViewDate(date)
    onSelect?.(date)
  }

  const selectYear = (year: number) => {
    const next = new Date(viewDate)
    next.setFullYear(year)
    setViewDate(next)
    // Seamless flow: Year -> Month -> Date
    setViewMode("month")
  }

  const selectMonth = (monthIndex: number) => {
    const next = new Date(viewDate)
    next.setMonth(monthIndex)
    setViewDate(next)
    // Month -> Date
    setViewMode("day")
  }

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    const next = new Date(viewDate)
    next.setMonth(next.getMonth() - 1)
    setViewDate(next)
  }

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    const next = new Date(viewDate)
    next.setMonth(next.getMonth() + 1)
    setViewDate(next)
  }

  const prevYear = (e: React.MouseEvent) => {
    e.stopPropagation()
    const next = new Date(viewDate)
    next.setFullYear(next.getFullYear() - 1)
    setViewDate(next)
  }

  const nextYear = (e: React.MouseEvent) => {
    e.stopPropagation()
    const next = new Date(viewDate)
    next.setFullYear(next.getFullYear() + 1)
    setViewDate(next)
  }

  const handleToday = () => {
    const today = new Date()
    selectDate(today)
  }

  const today = new Date()
  const currentViewYear = viewDate.getFullYear()
  const currentViewMonth = viewDate.getMonth()

  const daysInCurrentMonth = new Date(currentViewYear, currentViewMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(currentViewYear, currentViewMonth, 1).getDay()
  const daysInPrevMonth = new Date(currentViewYear, currentViewMonth, 0).getDate()

  const calendarDays: Array<{
    date: Date
    isOutside: boolean
    isToday: boolean
    isSelected: boolean
    dayNumber: number
  }> = []

  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i
    const dateObj = new Date(currentViewYear, currentViewMonth - 1, d)
    calendarDays.push({
      date: dateObj,
      isOutside: true,
      isToday: dateObj.toDateString() === today.toDateString(),
      isSelected: !!selectedDate && dateObj.toDateString() === selectedDate.toDateString(),
      dayNumber: d,
    })
  }

  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const dateObj = new Date(currentViewYear, currentViewMonth, d)
    calendarDays.push({
      date: dateObj,
      isOutside: false,
      isToday: dateObj.toDateString() === today.toDateString(),
      isSelected: !!selectedDate && dateObj.toDateString() === selectedDate.toDateString(),
      dayNumber: d,
    })
  }

  const remainingCells = 42 - calendarDays.length
  for (let d = 1; d <= remainingCells; d++) {
    const dateObj = new Date(currentViewYear, currentViewMonth + 1, d)
    calendarDays.push({
      date: dateObj,
      isOutside: true,
      isToday: dateObj.toDateString() === today.toDateString(),
      isSelected: !!selectedDate && dateObj.toDateString() === selectedDate.toDateString(),
      dayNumber: d,
    })
  }

  const years: number[] = []
  for (let y = effectiveMinYear; y <= effectiveMaxYear; y++) {
    years.push(y)
  }

  return (
    <div
      className={cn(
        "w-[308px] max-w-full select-none text-card-foreground",
        className
      )}
    >
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60">
        {viewMode === "day" && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={prevMonth}
              className="size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
              aria-label="Previous month"
            >
              <ChevronLeft className="size-4" />
            </Button>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode("month")}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-sm font-semibold text-foreground hover:bg-accent hover:text-[#123f24] dark:hover:text-[#c5a84e] transition-colors border border-transparent hover:border-[#c5a84e]/30 cursor-pointer"
                title="Click to select month"
              >
                <span>{MONTHS[currentViewMonth]}</span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </button>

              <button
                type="button"
                onClick={() => setViewMode("year")}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-sm font-semibold text-foreground hover:bg-accent hover:text-[#123f24] dark:hover:text-[#c5a84e] transition-colors border border-transparent hover:border-[#c5a84e]/30 cursor-pointer"
                title="Click to select year"
              >
                <span>{currentViewYear}</span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </button>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={nextMonth}
              className="size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
              aria-label="Next month"
            >
              <ChevronRight className="size-4" />
            </Button>
          </>
        )}

        {viewMode === "month" && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={prevYear}
              className="size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
              aria-label="Previous year"
            >
              <ChevronLeft className="size-4" />
            </Button>

            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Select Month ·
              </span>
              <button
                type="button"
                onClick={() => setViewMode("year")}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-sm font-semibold text-foreground hover:bg-accent transition-colors border border-transparent hover:border-[#c5a84e]/30 cursor-pointer"
              >
                <span>{currentViewYear}</span>
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </button>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={nextYear}
              className="size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
              aria-label="Next year"
            >
              <ChevronRight className="size-4" />
            </Button>
          </>
        )}

        {viewMode === "year" && (
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Select Year ({effectiveMinYear}–{effectiveMaxYear})
            </span>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => setViewMode("day")}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Back
            </Button>
          </div>
        )}
      </div>

      {/* VIEW 1: DAY CALENDAR */}
      {viewMode === "day" && (
        <div className="animate-in fade-in zoom-in-95 duration-150">
          <div className="grid grid-cols-7 mb-1 text-center">
            {WEEKDAYS.map((dayName) => (
              <div
                key={dayName}
                className="h-7 flex items-center justify-center text-[0.75rem] font-semibold text-muted-foreground/80 select-none"
              >
                {dayName}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((item, idx) => {
              const isCurrentMonth = !item.isOutside
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => selectDate(item.date)}
                  className={cn(
                    "h-8 w-8 mx-auto flex items-center justify-center rounded-lg text-xs font-medium transition-all select-none cursor-pointer",
                    isCurrentMonth
                      ? "text-foreground hover:bg-[#c5a84e]/15 hover:text-[#123f24] dark:hover:text-[#c5a84e]"
                      : "text-muted-foreground/35 hover:text-muted-foreground hover:bg-accent/40",
                    item.isToday && !item.isSelected && "border border-[#c5a84e] font-bold text-[#123f24] dark:text-[#c5a84e]",
                    item.isSelected &&
                      "bg-[#123f24] text-white font-semibold ring-2 ring-[#c5a84e] shadow-sm hover:bg-[#123f24] hover:text-white dark:bg-[#c5a84e] dark:text-[#123f24]"
                  )}
                >
                  {item.dayNumber}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: MONTH SELECTION GRID */}
      {viewMode === "month" && (
        <div className="animate-in fade-in zoom-in-95 duration-150 py-1">
          <div className="grid grid-cols-3 gap-2">
            {SHORT_MONTHS.map((mName, idx) => {
              const isCurrent = idx === currentViewMonth
              const isSelected =
                !!selectedDate &&
                selectedDate.getFullYear() === currentViewYear &&
                selectedDate.getMonth() === idx
              return (
                <button
                  key={mName}
                  type="button"
                  onClick={() => selectMonth(idx)}
                  className={cn(
                    "py-2.5 px-3 rounded-lg text-xs font-semibold transition-all border text-center select-none cursor-pointer",
                    isSelected
                      ? "bg-[#123f24] text-white border-[#c5a84e] ring-2 ring-[#c5a84e]/40 dark:bg-[#c5a84e] dark:text-[#123f24]"
                      : isCurrent
                      ? "border-[#c5a84e]/70 bg-accent text-[#123f24] dark:text-[#c5a84e]"
                      : "border-transparent hover:border-[#c5a84e]/30 hover:bg-[#c5a84e]/15 text-foreground"
                  )}
                >
                  {mName}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: SCROLLABLE YEAR SELECTION GRID */}
      {viewMode === "year" && (
        <div
          ref={yearListRef}
          className="animate-in fade-in zoom-in-95 duration-150 max-h-56 overflow-y-auto pr-1 py-1 rounded-md"
        >
          <div className="grid grid-cols-4 gap-1.5">
            {years.map((y) => {
              const isCurrent = y === currentViewYear
              const isSelected = !!selectedDate && selectedDate.getFullYear() === y
              return (
                <button
                  key={y}
                  ref={isCurrent ? selectedYearRef : undefined}
                  type="button"
                  onClick={() => selectYear(y)}
                  className={cn(
                    "py-2 px-1 text-xs font-medium rounded-lg transition-all border text-center select-none cursor-pointer",
                    isSelected
                      ? "bg-[#123f24] text-white font-semibold border-[#c5a84e] ring-2 ring-[#c5a84e]/40 dark:bg-[#c5a84e] dark:text-[#123f24]"
                      : isCurrent
                      ? "border-[#c5a84e] bg-accent font-semibold text-[#123f24] dark:text-[#c5a84e]"
                      : "border-transparent hover:border-[#c5a84e]/30 hover:bg-[#c5a84e]/15 text-foreground"
                  )}
                >
                  {y}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* FOOTER ACTIONS */}
      <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between text-xs">
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={handleToday}
          className="text-[#123f24] dark:text-[#c5a84e] font-semibold hover:bg-accent"
        >
          Today
        </Button>

        {viewMode !== "day" && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setViewMode("day")}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Calendar view
          </Button>
        )}

        {clearable && selectedDate && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={onClear}
            className="text-muted-foreground hover:text-destructive gap-1"
          >
            <RotateCcw className="size-3" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}

export interface DatePickerProps {
  /** ISO date (`yyyy-mm-dd`); the value the form stores and the API receives. */
  value?: string | Date | null
  /** Called with an ISO `yyyy-mm-dd` string (or `""` when cleared). */
  onChange?: (value: string) => void
  disabled?: boolean
  placeholder?: string
  id?: string
  className?: string
  /** Earliest selectable year; defaults to 1900. */
  minYear?: number
  /** Latest selectable year; defaults to current year + 20. */
  maxYear?: number
  /** If true, treats field as Date of Birth (caps year at current year). */
  isDob?: boolean
  /** Popover alignment. Defaults to "end". */
  align?: "start" | "end" | "center"
  /** Whether to show clear button. Defaults to true. */
  clearable?: boolean
  /** Optional aria-label */
  "aria-label"?: string
}

/**
 * Reusable DatePicker component with masked input typing, popover calendar,
 * month/year selection grids, scrollable year ranges, and cream/gold styling.
 */
export function DatePicker({
  value,
  onChange,
  disabled = false,
  placeholder = "dd/mm/yyyy",
  id,
  className,
  minYear = 1900,
  maxYear,
  isDob = false,
  align = "end",
  clearable = true,
  "aria-label": ariaLabel = "Date picker",
}: DatePickerProps) {
  const stringVal = value instanceof Date ? dateToIso(value) : (value ?? "")
  const [text, setText] = React.useState(() => isoToDisplay(stringVal))
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    setText(isoToDisplay(stringVal))
  }, [stringVal])

  const handleTextInput = (raw: string) => {
    const masked = maskInput(raw)
    setText(masked)
    if (masked.length === 0) {
      onChange?.("")
      return
    }
    if (masked.length === 10) {
      const iso = displayToIso(masked)
      if (iso) {
        onChange?.(iso)
      }
    }
  }

  const handleBlur = () => {
    const iso = text ? displayToIso(text) : ""
    if (iso) {
      onChange?.(iso)
      setText(isoToDisplay(iso))
    } else if (!text) {
      onChange?.("")
      setText("")
    } else {
      setText(isoToDisplay(stringVal))
    }
  }

  const handleSelectDate = (date: Date) => {
    const iso = dateToIso(date)
    onChange?.(iso)
    setText(isoToDisplay(iso))
    setOpen(false)
  }

  const handleClear = () => {
    onChange?.("")
    setText("")
    setOpen(false)
  }

  return (
    <div className={cn("relative flex items-center gap-1.5", className)}>
      <Input
        id={id}
        value={text}
        disabled={disabled}
        placeholder={placeholder}
        inputMode="numeric"
        autoComplete="off"
        className="w-full bg-background font-mono text-sm tracking-wide"
        onChange={(e) => handleTextInput(e.target.value)}
        onBlur={handleBlur}
        aria-label={ariaLabel}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={disabled}
            aria-label="Open calendar"
            className={cn(
              "shrink-0 transition-colors border-border hover:bg-accent hover:text-accent-foreground",
              open && "border-[#c5a84e] bg-accent text-[#123f24] ring-2 ring-[#c5a84e]/30"
            )}
          >
            <CalendarIcon className="size-4" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align={align}
          sideOffset={6}
          collisionPadding={16}
          className="w-auto p-3 rounded-xl border border-border/80 bg-card/95 backdrop-blur-sm shadow-xl dark:bg-[#1a1917]/95"
        >
          <Calendar
            selected={stringVal}
            onSelect={handleSelectDate}
            onClear={handleClear}
            minYear={minYear}
            maxYear={maxYear}
            isDob={isDob}
            clearable={clearable}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
