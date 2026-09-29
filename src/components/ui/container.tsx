import type { HTMLAttributes } from "react";
import { cx } from "@/lib/cx";

type ContainerElement = "div" | "section" | "header" | "footer" | "nav";

interface ContainerProps extends HTMLAttributes<HTMLElement> {
  as?: ContainerElement;
}

export function Container({ as: Element = "div", className, ...props }: ContainerProps) {
  return <Element className={cx("container", className)} {...props} />;
}
