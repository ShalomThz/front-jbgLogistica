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
  const isLastStep = currentIndex === steps.length - 1;

  return (
    <nav className="flex items-center gap-2">
      {steps.map((s, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = s.key === currentStep;
        const isClickable = isCompleted && !isLastStep;

        return (
          <div key={s.key} className="flex items-center gap-2">
            {i > 0 && (
              <div className={`h-px w-8 ${isCompleted || isCurrent ? "bg-primary" : "bg-border"}`} />
            )}
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(s.key)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                isCurrent && isLastStep
                  ? "bg-green-600 text-white"
                  : isCurrent
                    ? "bg-primary text-primary-foreground"
                  : isCompleted
                    ? isLastStep
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 cursor-default"
                      : "bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                    : "bg-muted text-muted-foreground cursor-default"
              }`}
            >
              {isCompleted || isCurrent ? (
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
