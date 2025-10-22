import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Questionnaire | JobE',
  description: 'Manage questionnaires and surveys',
};

export default function QuestionnairePage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Questionnaire</h1>
      <p className="text-muted-foreground">
        Manage questionnaires and surveys
      </p>
    </div>
  );
}
