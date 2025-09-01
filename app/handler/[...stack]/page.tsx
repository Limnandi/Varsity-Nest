import { StackHandler } from "@stackframe/stack"
import { getStackServerApp } from "@/lib/stack"

export default function Page(props: any) {
  return StackHandler({ app: getStackServerApp(), routeProps: props }) as unknown as React.ReactElement
}


