import { Check } from 'lucide-react'

const steps = [
    { id: 1, label: 'Enter URL' },
    { id: 2, label: 'Select Pages' },
    { id: 3, label: 'Review' },
    { id: 4, label: 'Export' },
]

export default function StepProgress({ currentStep }) {
    return (
        <div className="flex items-center justify-center">
            {steps.map((step, index) => {
                const isActive = step.id === currentStep
                const isCompleted = step.id < currentStep

                return (
                    <div key={step.id} className="flex items-center">
                        {/* Step */}
                        <div className="flex items-center gap-3">
                            <div
                                className={`
                  w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold
                  transition-all duration-300
                  ${isCompleted
                                        ? 'icon-container text-white'
                                        : isActive
                                            ? 'icon-container text-white'
                                            : 'bg-gray-100 text-gray-400'
                                    }
                `}
                            >
                                {isCompleted ? (
                                    <Check className="w-4 h-4" strokeWidth={2.5} />
                                ) : (
                                    step.id
                                )}
                            </div>
                            <span
                                className={`
                  text-sm font-medium transition-colors hidden md:block
                  ${isActive ? 'text-gray-900' : isCompleted ? 'text-gray-700' : 'text-gray-400'}
                `}
                            >
                                {step.label}
                            </span>
                        </div>

                        {/* Connector */}
                        {index < steps.length - 1 && (
                            <div className="w-8 md:w-16 h-0.5 mx-3 md:mx-5 rounded-full overflow-hidden bg-gray-100">
                                <div
                                    className={`
                    h-full transition-all duration-500 rounded-full
                    ${step.id < currentStep
                                            ? 'w-full bg-gradient-to-r from-indigo-500 to-purple-500'
                                            : 'w-0'
                                        }
                  `}
                                />
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
