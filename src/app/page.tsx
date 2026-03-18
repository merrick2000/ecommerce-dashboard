import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-center space-y-6 max-w-lg">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Digital Products Dashboard
        </h1>
        <p className="text-lg text-gray-600">
          Manage your stores, sell your digital files safely, and monitor your revenue from one central place.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/dashboard">
            <Button size="lg">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
