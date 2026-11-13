export default function ProgressSteps({ steps, currentStep, progress, label }) {
  const progressValue = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div className="progress-steps" aria-label={`${label} progress`}>
      <div
        className="progress-steps-track"
        role="progressbar"
        aria-label={`${label} completion`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressValue}
      >
        <span className="progress-steps-fill" style={{ width: `${progressValue}%` }} />
      </div>
      <ol className="progress-steps-list">
        {steps.map((step, index) => (
          <li
            className={`progress-step${index < currentStep ? ' is-complete' : ''}${index === currentStep ? ' is-current' : ''}`}
            key={step}
            aria-current={index === currentStep ? 'step' : undefined}
          >
            <span className="progress-step-marker" aria-hidden="true">
              {index < currentStep ? '✓' : index + 1}
            </span>
            <span className="progress-step-label">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
