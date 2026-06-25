import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#000] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800 transition-colors pt-12 md:pt-16">
      <div className="max-w-3xl mx-auto px-6 pb-20">
        <article className="prose prose-zinc dark:prose-invert max-w-none">
          <h1>Privacy Policy</h1>
          <p>Last updated: June 2026</p>
          
          <h2>1. Information We Collect</h2>
          <p>
            When you use Rackle, we may collect the following types of information:
          </p>
          <ul>
            <li><strong>Account Information:</strong> Name, email address, and authentication credentials.</li>
            <li><strong>Usage Data:</strong> Information about your interactions with the Rackle observability platform, including API requests, tracing data, and dashboard analytics.</li>
            <li><strong>Telemetry Data:</strong> Metrics, logs, and trace contexts submitted via our SDKs for AI agent debugging.</li>
          </ul>

          <h2>2. How We Use Your Information</h2>
          <p>
            We use the information we collect to:
          </p>
          <ul>
            <li>Provide, maintain, and improve the Rackle platform.</li>
            <li>Process and securely store your AI execution traces.</li>
            <li>Communicate with you regarding account updates, security alerts, and support messages.</li>
            <li>Analyze usage patterns to enhance our AI Copilot and analytics engine.</li>
          </ul>

          <h2>3. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your data. Your API keys and traces are stored securely and are never shared with unauthorized third parties. We do not use your proprietary tracing data to train our own base models without your explicit consent.
          </p>

          <h2>4. Your Rights</h2>
          <p>
            You have the right to access, update, or delete your personal information. You can manage your API keys and data retention settings directly from the Rackle dashboard.
          </p>

          <h2>5. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at privacy@rackle.ai.
          </p>
        </article>
      </div>
    </div>
  );
}
