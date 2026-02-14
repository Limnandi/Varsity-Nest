import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Varsity Nest',
  description: 'Terms of Service for Varsity Nest - Accommodation listing platform',
  alternates: { canonical: 'https://varsitynest.space/terms' },
  openGraph: {
    title: 'Terms of Service | Varsity Nest',
    description: 'Terms of Service for Varsity Nest - Accommodation listing platform',
    url: 'https://varsitynest.space/terms',
    siteName: 'Varsity Nest',
    type: 'website',
    images: ['/images/logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Terms of Service | Varsity Nest',
    description: 'Terms of Service for Varsity Nest - Accommodation listing platform',
    images: ['/images/logo.png'],
  },
}

// Terms of Service page.
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#02042b] to-[#040945] px-4 py-12">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl tracking-tight">
            Terms of Service
          </h1>
          <p className="text-neutral-300 text-base">Last Updated: November 2025</p>
        </div>

        {/* Terms Content */}
        <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-white shadow-2xl shadow-blue-500/20">
            <div className="prose prose-invert max-w-none">
              <p className="text-neutral-300 text-base mb-10 leading-relaxed">
                Welcome to Varsity Nest, operated by Massive Operations. By accessing and using our services, you agree to comply with and be bound by the following Terms of Service (TOS). Please read them carefully. These Terms of Service are between you and Massive Operations, operating as Varsity Nest.
              </p>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">1. Acceptance of Terms</h2>
                <p className="text-neutral-300 leading-relaxed text-base">
                  By using the Varsity Nest platform (operated by Massive Operations), including any related websites, mobile applications, services, or features (collectively referred to as &quot;the Service&quot;), you agree to these Terms of Service. If you do not agree to these terms, you must immediately discontinue use of the Service.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">2. Changes to Terms</h2>
                <p className="text-neutral-300 leading-relaxed text-base">
                  Massive Operations reserves the right to modify, amend, or update these Terms of Service at any time. All changes will be posted on this page, and the &quot;Last Updated&quot; date will reflect the date of the most recent changes. It is your responsibility to review these terms periodically.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">3. Eligibility</h2>
                <p className="text-neutral-300 leading-relaxed text-base">
                  You must be a registered student at a university or institution to use Varsity Nest services. By agreeing to these terms, you affirm that you meet this eligibility requirement.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">4. Account Registration</h2>
                <ul className="text-neutral-300 leading-relaxed space-y-3 text-base ml-6">
                  <li>• You are required to create an account to use the full features of Varsity Nest.</li>
                  <li>• You agree to provide accurate, complete, and up-to-date information during the registration process.</li>
                  <li>• You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account.</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">5. Use of Service</h2>
                <p className="text-neutral-300 leading-relaxed mb-5 text-base">
                  Varsity Nest (operated by Massive Operations) provides a platform for university students to access accommodation listings and related services. You agree to use the Service in accordance with all applicable laws and regulations and not to misuse or disrupt the Service in any way.
                </p>
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-red-400 mb-3">Prohibited Actions:</h3>
                  <ul className="text-neutral-300 space-y-2 text-base ml-4">
                    <li>• <strong>Illegal Activities:</strong> You agree not to engage in any unlawful activities while using Varsity Nest, including but not limited to fraud, theft, harassment, or violation of intellectual property rights.</li>
                    <li>• <strong>Abuse or Misuse:</strong> You may not use the platform to spam, abuse, or otherwise mislead other users.</li>
                    <li>• <strong>Impersonation:</strong> You may not impersonate any person or entity, or falsely state or otherwise mislead others regarding your affiliation with any person or entity.</li>
                  </ul>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">6. Privacy Policy</h2>
                <p className="text-neutral-300 leading-relaxed text-base">
                  Your use of the Service is also governed by our Privacy Policy, which outlines how Massive Operations collects, uses, and protects your personal information. By using Varsity Nest, you agree to the practices described in the Privacy Policy.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">7. Data Protection & GDPR Compliance</h2>
                <p className="text-neutral-300 leading-relaxed text-base">
                  Massive Operations is committed to protecting your personal data in accordance with applicable data protection laws. We collect, process, and store your personal information only as necessary to provide our services and in compliance with our Privacy Policy. You have the right to access, correct, or delete your personal data at any time.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">8. Fees and Payment</h2>
                <p className="text-neutral-300 leading-relaxed mb-5 text-base">
                  Certain features or services on Varsity Nest may require payment. You agree to pay all applicable fees for these services and any other charges incurred through your account. All payments are processed securely through Paystack, and you agree to comply with the payment terms outlined.
                </p>
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-red-400 mb-3">No Refund Policy:</h3>
                  <p className="text-neutral-300 text-base">
                    <strong>ALL SALES ARE FINAL.</strong> By clicking &quot;Accept&quot; or &quot;Agree&quot; to any service or payment, you acknowledge that no refunds will be provided under any circumstances. Refunds will only be considered in cases of technical errors resulting in duplicate or unauthorized charges, which must be reported within 24 hours of the transaction.
                  </p>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">9. Service Availability</h2>
                <p className="text-neutral-300 leading-relaxed text-base">
                  While Massive Operations strives to maintain continuous service availability, Varsity Nest may experience downtime for maintenance, updates, or technical issues. We do not guarantee uninterrupted service and are not liable for any service interruptions.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">10. Intellectual Property Rights</h2>
                <p className="text-neutral-300 leading-relaxed text-base">
                  All content, logos, trademarks, and other intellectual property provided through the Service are owned by Massive Operations (operating as Varsity Nest) or its licensors and are protected by intellectual property laws. You may not use or reproduce any content from the Service without prior written permission.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">11. User-Generated Content</h2>
                <p className="text-neutral-300 leading-relaxed mb-4 text-base">
                  You may submit reviews, listings, or other content to the Service. By submitting content, you grant Massive Operations a non-exclusive, royalty-free license to use, modify, and display the content for the purpose of operating the Service.
                </p>
                <p className="text-neutral-300 leading-relaxed text-base">
                  You represent and warrant that you have the necessary rights to submit the content and that it does not violate any third-party rights or laws. Massive Operations reserves the right to moderate, edit, or remove any user-generated content that violates these terms.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">12. Third-Party Services</h2>
                <p className="text-neutral-300 leading-relaxed text-base">
                  Varsity Nest integrates with third-party services including StackAuth for authentication and Paystack for payments. Your use of these services is subject to their respective terms of service and privacy policies. Massive Operations is not responsible for the actions or policies of these third-party services.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">13. Disclaimers and Limitation of Liability</h2>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5 mb-5">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-3">No Warranties:</h3>
                  <p className="text-neutral-300 text-base">
                    The Service is provided &quot;as is&quot; without any warranties or guarantees. Massive Operations does not guarantee that the Service will be error-free, uninterrupted, or secure.
                  </p>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-3">Limitation of Liability:</h3>
                  <p className="text-neutral-300 text-base">
                    To the fullest extent permitted by law, Massive Operations is not liable for any indirect, incidental, or consequential damages arising from your use of the Service. Our total liability is limited to the amount you have paid for the Service.
                  </p>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">14. Termination and Suspension</h2>
                <p className="text-neutral-300 leading-relaxed text-base">
                  Massive Operations reserves the right to suspend or terminate your account and access to the Service if you violate these Terms of Service or for any other reason deemed appropriate by Massive Operations.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">15. Dispute Resolution</h2>
                <p className="text-neutral-300 leading-relaxed text-base">
                  Before pursuing any legal action, you agree to first attempt to resolve any disputes through good faith negotiations. If a resolution cannot be reached, disputes will be resolved through binding arbitration in accordance with the rules of the South African Arbitration Foundation.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">16. Indemnification</h2>
                <p className="text-neutral-300 leading-relaxed text-base">
                  You agree to indemnify and hold harmless Massive Operations, its employees, affiliates, and partners from any claims, damages, or expenses arising from your use of the Service or any violation of these Terms of Service.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">17. Governing Law</h2>
                <p className="text-neutral-300 leading-relaxed text-base">
                  These Terms of Service are governed by and construed in accordance with the laws of South Africa. Any disputes arising from or related to these Terms shall be resolved in the courts of South Africa.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">18. Severability</h2>
                <p className="text-neutral-300 leading-relaxed text-base">
                  If any provision of these Terms of Service is found to be invalid or unenforceable, the remainder of the terms will remain in full effect.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">19. Contact Information</h2>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
                  <p className="text-neutral-300 mb-3 text-base">
                    If you have any questions or concerns regarding these Terms of Service, please contact Massive Operations at:
                  </p>
                  <p className="text-blue-300 font-semibold text-base mb-2">Email: support@varsitynest.co.za</p>
                  <p className="text-blue-300 font-semibold text-base">Company: Massive Operations (operating as Varsity Nest)</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
  )
}
