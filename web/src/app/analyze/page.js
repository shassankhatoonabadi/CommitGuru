import { Suspense } from 'react';
import AnalyzeClient from './AnalyzeClient';

export default function AnalyzePage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <Suspense fallback={<p>Loading client...</p>}>
        <AnalyzeClient />
      </Suspense>
    </main>
  );
}
