"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/style.css"

import { cn } from "@/lib/utils"
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "w-fit rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-none [--rdp-accent-color:var(--primary)] [--rdp-accent-background-color:var(--muted)] [--rdp-day-height:2rem] [--rdp-day-width:2rem] [--rdp-day_button-height:2rem] [--rdp-day_button-width:2rem] [--rdp-day_button-border-radius:var(--radius)] [--rdp-nav-height:2.25rem] [--rdp-nav_button-height:2rem] [--rdp-nav_button-width:2rem] [--rdp-selected-border:2px_solid_var(--primary)] [--rdp-today-color:var(--primary)] [--rdp-weekday-opacity:1]",
        className
      )}
      classNames={{
        ...classNames,
        month_caption: cn(
          "mb-1 flex h-9 items-center justify-center px-9",
          classNames?.month_caption
        ),
        caption_label: cn("text-sm font-medium", classNames?.caption_label),
        nav: cn(
          "absolute top-3 right-3 left-3 flex items-center justify-between",
          classNames?.nav
        ),
        button_previous: cn(
          "inline-flex size-8 items-center justify-center rounded-md border border-border bg-background text-foreground shadow-none hover:bg-muted",
          classNames?.button_previous
        ),
        button_next: cn(
          "inline-flex size-8 items-center justify-center rounded-md border border-border bg-background text-foreground shadow-none hover:bg-muted",
          classNames?.button_next
        ),
        weekday: cn(
          "w-8 text-[0.8rem] font-normal text-muted-foreground",
          classNames?.weekday
        ),
        day: cn("p-0", classNames?.day),
        day_button: cn(
          "size-8 rounded-md text-sm font-normal hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50",
          classNames?.day_button
        ),
        selected: cn("font-medium", classNames?.selected),
        today: cn("font-medium", classNames?.today),
        outside: cn("text-muted-foreground/70", classNames?.outside),
        disabled: cn("text-muted-foreground opacity-40", classNames?.disabled),
      }}
      components={{
        Chevron: ({ orientation, className: chevronClass, ...rest }) => {
          const Icon =
            orientation === "left" ? IconChevronLeft : IconChevronRight
          return (
            <Icon className={cn("size-4 shrink-0", chevronClass)} {...rest} />
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

export { Calendar }
