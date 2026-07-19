import React, { useState } from 'react';
import { View } from 'react-native';
import { usePatientDashboard } from '../../../../context/PatientDashboardContext';
import { Step1Start } from './symptom-checker/Step1Start';
import { Step2Choose } from './symptom-checker/Step2Choose';
import { Step3Duration } from './symptom-checker/Step3Duration';
import { Step4Severity } from './symptom-checker/Step4Severity';
import { Step5RedFlags } from './symptom-checker/Step5RedFlags';
import { Step6Result } from './symptom-checker/Step6Result';
import { useComponentContext } from '../../../../context/GlobalContext';

export function SymptomChecker() {
  const { navigateToDashboard, symptomCheckerProps } = usePatientDashboard();
  const { checkupsApi } = useComponentContext();
  const [step, setStep] = useState(symptomCheckerProps?.step || 1);
  const [data, setData] = useState({
    symptoms: [],
    duration: '',
    severity: 5,
    redFlags: []
  });
  const [resultData, setResultData] = useState(symptomCheckerProps?.resultData || null);
  const [isLoading, setIsLoading] = useState(false);

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => {
    if (step === 1) {
      navigateToDashboard();
    } else {
      setStep(s => s - 1);
    }
  };
  const close = () => navigateToDashboard();

  const updateData = (newData) => setData(prev => ({ ...prev, ...newData }));

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const response = await checkupsApi.save(data);
      setResultData(response);
      setStep(6);
    } catch (error) {
      console.error('Failed to save checkup', error);
      // fallback to mock local behavior
      setResultData({ payload: data, recommendations: {} });
      setStep(6);
    } finally {
      setIsLoading(false);
    }
  };

  switch (step) {
    case 1: return <Step1Start onNext={nextStep} onBack={prevStep} />;
    case 2: return <Step2Choose data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
    case 3: return <Step3Duration data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
    case 4: return <Step4Severity data={data} updateData={updateData} onNext={nextStep} onBack={prevStep} />;
    case 5: return <Step5RedFlags data={data} updateData={updateData} onNext={handleSubmit} onBack={prevStep} isLoading={isLoading} />;
    case 6: return <Step6Result data={resultData} onBack={close} onClose={close} />;
    default: return <Step1Start onNext={nextStep} onBack={prevStep} />;
  }
}
