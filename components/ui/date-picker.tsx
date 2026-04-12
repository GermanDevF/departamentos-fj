"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { IconCalendar } from "@tabler/icons-react"

function parseLocalDateFromYmd(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined
  const [y, m, d] = value.split("-").map(Number)
  const date = new Date(y, m - 1, d)
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return undefined
  }
  return date
}

export interface DatePickerProps {
  id?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  className?: string
  placeholder?: string
  "aria-invalid"?: boolean
  "aria-describedby"?: string
}

function DatePicker({
  id,
  value,
  onChange,
  onBlur,
  disabled,
  className,
  placeholder = "Selecciona fecha",
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const selected = value ? parseLocalDateFromYmd(value) : undefined

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) onBlur?.()
      }}
    >
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          className={cn(
            "h-8 w-full min-w-0 justify-start gap-2 rounded-lg border-input bg-transparent px-2.5 py-2 text-left text-sm font-normal shadow-none hover:bg-muted dark:bg-input/30 dark:hover:bg-input/50",
            !value && "text-muted-foreground",
            className
          )}
        >
          <IconCalendar className="size-4 shrink-0 opacity-70" />
          <span className="truncate">
            {selected
              ? format(selected, "d MMMM yyyy", { locale: es })
              : placeholder}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={es}
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            if (date) {
              onChange(format(date, "yyyy-MM-dd"))
              setOpen(false)
            }
          }}
          autoFocus={open}
        />
      </PopoverContent>
    </Popover>
  )
}

export { DatePicker }
