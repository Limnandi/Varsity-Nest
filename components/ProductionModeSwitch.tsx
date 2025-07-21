"use client"

import { useTransition } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { updateProductionMode } from "@/lib/actions/admin.actions"

interface ProductionModeSwitchProps {
  isProduction: boolean
}

export default function ProductionModeSwitch({ isProduction }: ProductionModeSwitchProps) {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleToggle = (checked: boolean) => {
    startTransition(async () => {
      const result = await updateProductionMode(checked)
      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    })
  }

  return (
    <div className="flex items-center space-x-2">
      <Switch
        id="production-mode"
        checked={isProduction}
        onCheckedChange={handleToggle}
        disabled={isPending}
        aria-label="Toggle Production Mode"
      />
      <Label htmlFor="production-mode" className="flex flex-col">
        <span>Production Mode</span>
        <span className="text-xs text-muted-foreground">
          {isProduction ? "Live data is being used." : "Mock data is displayed."}
        </span>
      </Label>
    </div>
  )
}
