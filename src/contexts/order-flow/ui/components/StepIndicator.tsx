import { Check } from "lucide-react";

interface StepIndicatorProps<T extends string> {
  steps: { key: T; label: string }[];
  currentStep: T;
  onStepClick: (step: T) => void;
}

export function StepIndicator<T extends string>({
  steps,
  currentStep,
  onStepClick,
}: StepIndicatorProps<T>) {
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <nav className="flex items-center gap-2">
      {steps.map((s, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = s.key === currentStep;
        const isClickable = isCompleted;

        return (
          <div key={s.key} className="flex items-center gap-2">
            {i > 0 && (
              <div className={`h-px w-8 ${isCompleted ? "bg-primary" : "bg-border"}`} />
            )}
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(s.key)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                isCurrent
                  ? "bg-primary text-primary-foreground"
                  : isCompleted
                    ? "bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                    : "bg-muted text-muted-foreground cursor-default"
              }`}
            >
              {isCompleted ? (
                <Check className="size-3" />
              ) : (
                <span>{i + 1}</span>
              )}
              {s.label}
            </button>
          </div>
        );
      })}
    </nav>
  );
}
