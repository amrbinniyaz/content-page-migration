import { useState } from 'react'
import { MigrationProvider } from './context/MigrationContext'
import Header from './components/Header'
import StepProgress from './components/StepProgress'
import UrlInputPage from './pages/UrlInputPage'
import PageSelectionPage from './pages/PageSelectionPage'
import ReviewPage from './pages/ReviewPage'
import ExportPage from './pages/ExportPage'

function App() {
    const [currentStep, setCurrentStep] = useState(1)

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <UrlInputPage onNext={() => setCurrentStep(2)} />
            case 2:
                return <PageSelectionPage onNext={() => setCurrentStep(3)} onBack={() => setCurrentStep(1)} />
            case 3:
                return <ReviewPage onNext={() => setCurrentStep(4)} onBack={() => setCurrentStep(2)} />
            case 4:
                return <ExportPage onBack={() => setCurrentStep(3)} onStartNew={() => setCurrentStep(1)} />
            default:
                return <UrlInputPage onNext={() => setCurrentStep(2)} />
        }
    }

    return (
        <MigrationProvider>
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
                    <StepProgress currentStep={currentStep} />
                    <div className="mt-8 animate-fade-in">
                        {renderStep()}
                    </div>
                </main>
            </div>
        </MigrationProvider>
    )
}

export default App
