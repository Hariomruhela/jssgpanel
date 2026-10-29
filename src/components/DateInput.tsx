import { DatePicker, type DatePickerProps } from "@/components/DatePicker"

export interface DateInputProps extends DatePickerProps {
  value: string
  onChange: (value: string) => void
}

/**
 * A date field that always shows and accepts `dd/mm/yyyy`, while the form keeps
 * the ISO `yyyy-mm-dd` value the API expects. Includes an interactive calendar
 * picker with Year -> Month -> Date fast selection, scrollable years (1900+),
 * and the application cream/gold theme.
 */
export function DateInput(props: DateInputProps) {
  return <DatePicker {...props} />
}

export { DatePicker }
