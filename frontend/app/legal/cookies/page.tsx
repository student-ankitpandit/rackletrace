import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#000] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800 transition-colors pt-12 md:pt-16">
      <div className="max-w-3xl mx-auto px-6 pb-20">
        <article className="prose prose-zinc dark:prose-invert max-w-none">
          <h1>Cookie Policy</h1>
          <p>Last updated: June 2026</p>
          
          <h2>1. What Are Cookies</h2>
          <p>
            Cookies are small text files that are placed on your computer or mobile device when you browse websites. They are widely used to make websites work efficiently and provide tracking information to the owners of the site.
          </p>

          <h2>2. How We Use Cookies</h2>
          <p>
            Rackle uses cookies for the following purposes:
          </p>
          <ul>
            <li><strong>Authentication:</strong> To keep you signed in to your dashboard and verify your identity securely.</li>
            <li><strong>Preferences:</strong> To remember your settings, such as your preferred theme (light/dark mode).</li>
            <li><strong>Security:</strong> To detect and prevent fraudulent use of our platform.</li>
          </ul>

          <h2>3. Types of Cookies We Use</h2>
          <p>
            <strong>Essential Cookies:</strong> These are required for the operation of our platform. They include cookies that enable you to log into secure areas of our website.
            <br/><br/>
            <strong>Functional Cookies:</strong> These are used to recognize you when you return to our website. This enables us to personalize our content for you and remember your preferences.
          </p>

          <h2>4. Managing Cookies</h2>
          <p>
            Most web browsers allow you to control cookies through their settings preferences. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience, as it will no longer be personalized to you. It may also stop you from saving customized settings like login information.
          </p>
        </article>
      </div>
    </div>
  );
}
