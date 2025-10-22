import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings | JobE',
  description: 'Manage your settings and preferences',
};

export default function SettingsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Settings</h1>
      <p className="text-muted-foreground">
        Manage your settings and preferences
      </p>
    </div>
  );
}
