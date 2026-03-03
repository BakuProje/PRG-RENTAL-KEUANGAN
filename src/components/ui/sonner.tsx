import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      richColors
      expand
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-2xl rounded-xl ring-1 ring-border/50 p-4 transition-all duration-300",
          description: "group-[.toast]:text-muted-foreground text-sm",
          title: "text-base font-semibold",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground font-medium rounded-lg px-3 py-2",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground font-medium rounded-lg px-3 py-2",
          error: "group-[.toaster]:bg-destructive group-[.toaster]:text-destructive-foreground",
          success: "group-[.toaster]:bg-success group-[.toaster]:text-success-foreground",
          warning: "group-[.toaster]:bg-warning group-[.toaster]:text-warning-foreground",
          info: "group-[.toaster]:bg-blue-500 group-[.toaster]:text-white",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
