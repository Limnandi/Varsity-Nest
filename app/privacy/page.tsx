import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Varsity Nest',
  description: 'Privacy Policy for Varsity Nest - How we collect, use, and protect your personal information',
}

// Privacy Policy page with comprehensive data protection terms and GDPR compliance
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#02042b] to-[#040945] px-4 py-12">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-neutral-300 text-base">Last Updated: November 2025</p>
        </div>

        {/* Privacy Content */}
        <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-white shadow-2xl shadow-blue-500/20">
            <div className="prose prose-invert max-w-none">
              <p className="text-neutral-300 text-base mb-10 leading-relaxed">
                Massive Operations, operating as Varsity Nest (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), is committed to protecting your privacy and ensuring that your personal information is used responsibly. This Privacy Policy outlines how Massive Operations collects, uses, and protects the personal information of users who access or use Varsity Nest services.
              </p>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">1. Information We Collect</h2>
                <p className="text-neutral-300 leading-relaxed mb-5 text-base">
                  We collect the following types of information when you use Varsity Nest:
                </p>
                <ul className="text-neutral-300 leading-relaxed space-y-3 text-base ml-6">
                  <li>• <strong>Personal Information:</strong> When you register for an account, we collect personal details such as your name, email address, phone number, university affiliation, and other contact information.</li>
                  <li>• <strong>Account Information:</strong> Information you provide while using our platform, such as accommodation preferences, profile details, and payment information.</li>
                  <li>• <strong>Usage Data:</strong> Information about your interactions with the Service, including your device type, IP address, browser type, and other usage statistics (e.g., login times, pages visited).</li>
                  <li>• <strong>Cookies and Tracking Technologies:</strong> We use cookies and similar tracking technologies to enhance your user experience, track your activity on our site, and gather analytics data.</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">2. How We Use Your Information</h2>
                <p className="text-neutral-300 leading-relaxed mb-5 text-base">
                  The information we collect is used for the following purposes:
                </p>
                <ul className="text-neutral-300 leading-relaxed space-y-3 text-base ml-6">
                  <li>• <strong>To Provide Our Services:</strong> We use your information to create and manage your account, facilitate your access to listings and services, and allow you to engage with the platform&apos;s features.</li>
                  <li>• <strong>To Communicate with You:</strong> We may send you updates, notifications, newsletters, and promotional materials related to Varsity Nest. You can opt out of these communications at any time.</li>
                  <li>• <strong>To Process Payments:</strong> If applicable, we use your payment information to process transactions related to our paid services.</li>
                  <li>• <strong>To Improve the Platform:</strong> We analyze usage data to improve the performance and functionality of Varsity Nest, fix bugs, and ensure a better user experience.</li>
                  <li>• <strong>To Comply with Legal Obligations:</strong> We may use your data to comply with applicable laws, respond to legal requests, or prevent fraud.</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">3. Data Protection & Security</h2>
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 mb-5">
                  <h3 className="text-lg font-semibold text-green-400 mb-3">Security Measures:</h3>
                  <p className="text-neutral-300 text-base">
                    We use industry-standard security measures to protect your personal information, including encryption, secure servers, and access controls. However, no method of electronic storage or transmission is completely secure, and we cannot guarantee the absolute security of your data.
                  </p>
                </div>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-blue-400 mb-3">GDPR Compliance:</h3>
                  <p className="text-neutral-300 text-base">
                    Massive Operations is committed to complying with applicable data protection laws, including the General Data Protection Regulation (GDPR). We process your personal data lawfully, fairly, and transparently, and only for specified, explicit, and legitimate purposes.
                  </p>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">4. Data Sharing and Disclosure</h2>
                <p className="text-neutral-300 leading-relaxed mb-5 text-base">
                  We do not share or sell your personal information to third parties except in the following circumstances:
                </p>
                <ul className="text-neutral-300 leading-relaxed space-y-3 text-base ml-6">
                  <li>• <strong>Service Providers:</strong> We may share your information with trusted third-party service providers who assist us in operating the platform, processing payments, or conducting business activities on our behalf.</li>
                  <li>• <strong>Legal Compliance:</strong> We may disclose your information if required by law or in response to legal requests, such as subpoenas, court orders, or to protect our rights, property, or safety.</li>
                  <li>• <strong>Business Transfers:</strong> In the event of a merger, acquisition, or asset sale, your personal information may be transferred as part of that transaction.</li>
                </ul>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5 mt-5">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-3">Third-Party Services:</h3>
                  <p className="text-neutral-300 text-base">
                    We integrate with StackAuth for authentication and PayFast for payments. These services have their own privacy policies, and we encourage you to review them.
                  </p>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">5. Cookies and Tracking Technologies</h2>
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-purple-400 mb-3">Cookie Usage:</h3>
                  <ul className="text-neutral-300 space-y-2 text-base ml-4">
                    <li>• <strong>Essential Cookies:</strong> Required for basic platform functionality</li>
                    <li>• <strong>Analytics Cookies:</strong> Help us understand how you use our platform</li>
                    <li>• <strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                  </ul>
                  <p className="text-neutral-300 mt-3 text-base">
                    You can choose to disable cookies through your browser settings, but this may affect the functionality of the site.
                  </p>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">6. Your Data Rights</h2>
                <p className="text-neutral-300 leading-relaxed mb-5 text-base">
                  Depending on your location, you may have the following rights regarding your personal data:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-blue-400 mb-2">Access & Portability</h3>
                    <p className="text-neutral-300 text-sm">Request a copy of your personal data in a portable format</p>
                  </div>
                  <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-green-400 mb-2">Correction</h3>
                    <p className="text-neutral-300 text-sm">Correct any inaccurate or incomplete information</p>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-red-400 mb-2">Deletion</h3>
                    <p className="text-neutral-300 text-sm">Request deletion of your personal data (subject to legal requirements)</p>
                  </div>
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5">
                    <h3 className="text-lg font-semibold text-yellow-400 mb-2">Opt-out</h3>
                    <p className="text-neutral-300 text-sm">Unsubscribe from marketing communications at any time</p>
                  </div>
                </div>
                <p className="text-neutral-300 text-base">
                  To exercise any of these rights, please contact us using the contact details provided at the end of this policy.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">7. Data Retention</h2>
                <p className="text-neutral-300 leading-relaxed text-base">
                  We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law. When we no longer need your personal information, we will securely delete or anonymize it.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">8. Children&apos;s Privacy</h2>
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-5">
                  <p className="text-neutral-300 text-base">
                    Varsity Nest does not knowingly collect personal information from children under the age of 18. If you believe we have inadvertently collected personal information from a child, please contact us immediately so we can take appropriate action.
                  </p>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">9. International Data Transfers</h2>
                <p className="text-neutral-300 leading-relaxed text-base">
                  If you are accessing Varsity Nest from outside South Africa, please note that your information may be transferred to and stored in servers located in South Africa or other jurisdictions. By using the Service, you consent to this transfer of your personal information. We ensure appropriate safeguards are in place for such transfers.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">10. Third-Party Websites</h2>
                <p className="text-neutral-300 leading-relaxed text-base">
                  Our platform may contain links to third-party websites or services. This Privacy Policy only applies to Varsity Nest, and we are not responsible for the privacy practices or content of third-party sites. We encourage you to review the privacy policies of any third-party websites you visit.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">11. Changes to This Privacy Policy</h2>
                <p className="text-neutral-300 leading-relaxed text-base">
                  We may update this Privacy Policy from time to time. When we do, we will post the updated version on this page and update the &quot;Last Updated&quot; date. Please review this policy regularly to stay informed about how we protect your information.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">12. Contact Us</h2>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
                  <p className="text-neutral-300 mb-4 text-base">
                    If you have any questions or concerns about this Privacy Policy or how Massive Operations handles your personal information, please contact us at:
                  </p>
                  <div className="space-y-2">
                    <p className="text-blue-300 font-semibold text-base">Email: support@varsitynest.co.za</p>
                    <p className="text-blue-300 font-semibold text-base">Phone: +27 62 407 9139</p>
                    <p className="text-blue-300 font-semibold text-base">Address: Bloemfontein, 9300, South Africa</p>
                    <p className="text-blue-300 font-semibold text-base">Company: Massive Operations (operating as Varsity Nest)</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
  )
}
