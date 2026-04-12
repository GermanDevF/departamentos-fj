"use client"

import * as React from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
function parseMoney(raw: string): number | undefined {
  const cleaned = raw.replace(/,/g, "").replace(/[^\d.]/g, "")
  if (cleaned === "" || cleaned === ".") return undefined
  const n = Number.parseFloat(cleaned)
  if (!Number.isFinite(n) || n <= 0) return undefined
  return Math.round(n * 100) / 100
}

function formatAmount(n: number): string {
  return new Intl.NumberFormat("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n)
}

export type MoneyInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "onChange"
> & {
  value: number | undefined
  onChange: (value: number | undefined) => void
}

const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  function MoneyInput(
    {
      value,
      onChange,
      onBlur,
      onFocus,
      className,
      disabled,
      ...props
    },
    ref
  ) {
    const [focused, setFocused] = React.useState(false)
    const [text, setText] = React.useState("")

    React.useEffect(() => {
      if (!focused) {
        if (value != null && value > 0) {
          setText(formatAmount(value))
        } else {
          setText("")
        }
      }
    }, [value, focused])

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        disabled={disabled}
        placeholder="0.00"
        className={cn(
          "tabular-nums placeholder:text-muted-foreground/60",
          className
        )}
        value={text}
        onFocus={(e) => {
          setFocused(true)
          setText(value != null && value > 0 ? String(value) : "")
          onFocus?.(e)
        }}
        onChange={(e) => {
          const raw = e.target.value
          setText(raw)
          onChange(parseMoney(raw))
        }}
        onBlur={(e) => {
          setFocused(false)
          if (value != null && value > 0) {
            setText(formatAmount(value))
          } else {
            setText("")
          }
          onBlur?.(e)
        }}
        {...props}
      />
    )
  }
)

export { MoneyInput }
