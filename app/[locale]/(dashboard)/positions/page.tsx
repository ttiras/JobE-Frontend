import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Positions | JobE',
  description: 'Manage job positions',
};

export default function PositionsPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Positions</h1>
      <p className="text-muted-foreground">
        Manage job positions
      </p>
    </div>
  );
}
