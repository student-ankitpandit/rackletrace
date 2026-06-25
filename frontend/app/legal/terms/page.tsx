import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#000] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800 transition-colors pt-12 md:pt-16">
      <div className="max-w-3xl mx-auto px-6 pb-20">
        <article className="prose prose-zinc dark:prose-invert max-w-none">
          <h1>Terms of Service</h1>
          <p>Last updated: June 2026</p>
          
          <h2>1. Acceptance of Terms</h2>
          <p>
            By accessing or using the Rackle observability platform, SDKs, and associated services, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
          </p>

          <h2>2. Description of Service</h2>
          <p>
            Rackle provides an AI observability suite that allows developers to trace, analyze, and debug AI agents. We reserve the right to modify, suspend, or discontinue the service at any time with or without notice.
          </p>

          <h2>3. API Usage and Rate Limiting</h2>
          <p>
            You are responsible for maintaining the confidentiality of your API keys. Rackle enforces rate limiting on ingestion endpoints to ensure platform stability. Excessive abuse of the API may result in temporary or permanent suspension of your account.
          </p>

          <h2>4. Intellectual Property</h2>
          <p>
            The Rackle platform, including its original code, design, and features, is owned by Rackle and is protected by international copyright and intellectual property laws. You retain all rights to the tracing data and proprietary prompts you submit to the platform.
          </p>

          <h2>5. Limitation of Liability</h2>
          <p>
            In no event shall Rackle, nor its directors, employees, or partners, be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.
          </p>

          <h2>6. Governing Law</h2>
          <p>
            These Terms shall be governed and construed in accordance with the laws, without regard to its conflict of law provisions.
          </p>
        </article>
      </div>
    </div>
  );
}
