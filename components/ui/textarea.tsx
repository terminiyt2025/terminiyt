import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[70px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:border-ring disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-gray-500 placeholder:text-base placeholder:font-normal",
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
