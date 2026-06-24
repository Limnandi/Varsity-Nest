import { createPageMetadata } from '@/lib/site-metadata'

export const metadata = createPageMetadata({
  title: 'Cookies Policy',
  description: 'Cookies Policy for Varsity Nest - How we use cookies and tracking technologies',
  pathname: '/cookies',
})

// Cookies Policy page explaining cookie usage and tracking technologies
export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#02042b] to-[#040945] px-4 py-12">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl tracking-tight">
            Cookies Policy
          </h1>
          <p className="text-neutral-300 text-base">Last Updated: November 2025</p>
        </div>

        {/* Cookies Content */}
        <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-white shadow-2xl shadow-blue-500/20">
            <div className="prose prose-invert max-w-none">
              <p className="text-neutral-300 text-base mb-10 leading-relaxed">
                This Cookies Policy explains how Massive Operations, operating as Varsity Nest (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), uses cookies and similar tracking technologies when you visit our website or use our platform. By using Varsity Nest services, you agree to the use of cookies as described in this policy.
              </p>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">1. What Are Cookies?</h2>
                <p className="text-neutral-300 leading-relaxed mb-4 text-base">
                  Cookies are small text files that are placed on your device (computer, tablet, or mobile phone) when you visit a website. They are widely used to make websites work more efficiently and to provide information to website owners. Cookies allow websites to remember your actions and preferences over a period of time, so you don&apos;t have to keep re-entering them whenever you come back to the site or browse from one page to another.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">2. Types of Cookies We Use</h2>
                <p className="text-neutral-300 leading-relaxed mb-5 text-base">
                  We use the following types of cookies on Varsity Nest:
                </p>
                
                <div className="space-y-5">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
                    <h3 className="text-xl font-semibold text-white mb-3">Essential Cookies</h3>
                    <p className="text-neutral-300 leading-relaxed mb-3 text-base">
                      These cookies are necessary for the website to function properly. They enable core functionality such as security, network management, and accessibility. You cannot opt out of these cookies, as they are essential for the service to work.
                    </p>
                    <ul className="text-neutral-300 leading-relaxed space-y-2 text-base ml-4">
                      <li>• Authentication cookies to keep you logged in</li>
                      <li>• Session management cookies</li>
                      <li>• Security cookies to protect against fraud</li>
                    </ul>
                  </div>

                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-5">
                    <h3 className="text-xl font-semibold text-white mb-3">Performance and Analytics Cookies</h3>
                    <p className="text-neutral-300 leading-relaxed mb-3 text-base">
                      These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously. This helps us improve the way our website works.
                    </p>
                    <ul className="text-neutral-300 leading-relaxed space-y-2 text-base ml-4">
                      <li>• Page views and navigation patterns</li>
                      <li>• Time spent on pages</li>
                      <li>• Error messages and performance issues</li>
                    </ul>
                  </div>

                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5">
                    <h3 className="text-xl font-semibold text-white mb-3">Functionality Cookies</h3>
                    <p className="text-neutral-300 leading-relaxed mb-3 text-base">
                      These cookies allow the website to remember choices you make (such as your username, language, or region) and provide enhanced, more personal features.
                    </p>
                    <ul className="text-neutral-300 leading-relaxed space-y-2 text-base ml-4">
                      <li>• Language preferences</li>
                      <li>• User interface preferences</li>
                      <li>• Remembered search criteria</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">3. Third-Party Cookies</h2>
                <p className="text-neutral-300 leading-relaxed mb-5 text-base">
                  In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the service, deliver advertisements on and through the service, and so on. These third parties may include:
                </p>
                <ul className="text-neutral-300 leading-relaxed space-y-3 text-base ml-6">
                  <li>• <strong>Analytics Services:</strong> We use analytics services to help us understand how users interact with our platform and improve our services.</li>
                  <li>• <strong>Authentication Services:</strong> We use third-party authentication providers (Stack Auth) to manage user authentication and session management.</li>
                  <li>• <strong>Payment Processors:</strong> When you make payments, our payment processors may set cookies to ensure secure transactions.</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">4. How Long Do Cookies Last?</h2>
                <p className="text-neutral-300 leading-relaxed mb-5 text-base">
                  Cookies may be either &quot;persistent&quot; cookies or &quot;session&quot; cookies:
                </p>
                <ul className="text-neutral-300 leading-relaxed space-y-3 text-base ml-6">
                  <li>• <strong>Session Cookies:</strong> These cookies are temporary and expire when you close your browser. They are used to maintain your session while you browse our website.</li>
                  <li>• <strong>Persistent Cookies:</strong> These cookies remain on your device for a set period or until you delete them. They help us remember your preferences and improve your experience on future visits.</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">5. Managing Cookies</h2>
                <p className="text-neutral-300 leading-relaxed mb-4 text-base">
                  You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences by setting or amending your web browser controls to accept or refuse cookies. Most web browsers automatically accept cookies, but you can usually modify your browser settings to decline cookies if you prefer.
                </p>
                <p className="text-neutral-300 leading-relaxed mb-5 text-base">
                  However, please note that if you choose to disable cookies, some features of our website may not function properly or may be unavailable. Essential cookies cannot be disabled, as they are necessary for the website to function.
                </p>
                <p className="text-neutral-300 leading-relaxed mb-4 text-base">
                  To manage cookies in your browser:
                </p>
                <ul className="text-neutral-300 leading-relaxed space-y-3 text-base ml-6">
                  <li>• <strong>Chrome:</strong> Settings &gt; Privacy and Security &gt; Cookies and other site data</li>
                  <li>• <strong>Firefox:</strong> Options &gt; Privacy &amp; Security &gt; Cookies and Site Data</li>
                  <li>• <strong>Safari:</strong> Preferences &gt; Privacy &gt; Cookies and website data</li>
                  <li>• <strong>Edge:</strong> Settings &gt; Privacy, Search, and Services &gt; Cookies and site permissions</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">6. Cookies Used on Varsity Nest</h2>
                <p className="text-neutral-300 leading-relaxed mb-5 text-base">
                  Specifically, we use cookies for:
                </p>
                <ul className="text-neutral-300 leading-relaxed space-y-3 text-base ml-6">
                  <li>• Maintaining your login session and authentication state</li>
                  <li>• Remembering your preferences and settings</li>
                  <li>• Analyzing website traffic and user behavior</li>
                  <li>• Ensuring website security and preventing fraud</li>
                  <li>• Providing personalized content and recommendations</li>
                  <li>• Supporting reCAPTCHA verification</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">7. Updates to This Policy</h2>
                <p className="text-neutral-300 leading-relaxed text-base">
                  We may update this Cookies Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We will notify you of any changes by posting the new Cookies Policy on this page and updating the &quot;Last Updated&quot; date. We encourage you to review this policy periodically.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">8. Contact Us</h2>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
                  <p className="text-neutral-300 mb-4 text-base">
                    If you have any questions about Massive Operations&apos; use of cookies or this Cookies Policy, please contact us at:
                  </p>
                  <ul className="text-neutral-300 leading-relaxed space-y-2 text-base ml-4">
                    <li>• Email: <a href="mailto:support@varsitynest" className="text-blue-400 hover:text-blue-300 transition-colors">support@varsitynest.space</a></li>
                    <li>• Phone: +27 62 407 9139</li>
                    <li>• Address: Bloemfontein, 9300, South Africa</li>
                    <li>• Company: Massive Operations (operating as Varsity Nest)</li>
                  </ul>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
  )
}

