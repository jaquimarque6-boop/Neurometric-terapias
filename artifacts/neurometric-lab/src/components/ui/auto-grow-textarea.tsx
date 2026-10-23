import { useCallback, useEffect, useLayoutEffect, useRef, type ComponentProps } from "react";
import { Textarea } from "@/components/ui/textarea";
import { calculateAutoGrowTextareaLayout } from "@/utils/auto-grow-textarea";

type AutoGrowTextareaProps = Omit<ComponentProps<typeof Textarea>, "rows"> & {
  minRows?: number;
  maxRows?: number;
};

export function AutoGrowTextarea({
  minRows = 7,
  maxRows = 16,
  value,
  defaultValue,
  className,
  ...props
}: AutoGrowTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const computed = window.getComputedStyle(textarea);
    const number = (property: string) => Number.parseFloat(property) || 0;
    const layout = calculateAutoGrowTextareaLayout({
      scrollHeight: textarea.scrollHeight,
      lineHeight: number(computed.lineHeight) || 20,
      paddingTop: number(computed.paddingTop),
      paddingBottom: number(computed.paddingBottom),
      borderTopWidth: number(computed.borderTopWidth),
      borderBottomWidth: number(computed.borderBottomWidth),
      minRows,
      maxRows,
    });

    textarea.style.height = `${layout.height}px`;
    textarea.style.overflowY = layout.overflowY;
  }, [minRows, maxRows]);

  useLayoutEffect(() => {
    resize();
  }, [resize, value, defaultValue]);

  useEffect(() => {
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [resize]);

  return (
    <Textarea
      {...props}
      ref={textareaRef}
      rows={minRows}
      value={value}
      defaultValue={defaultValue}
      className={className}
    />
  );
}
