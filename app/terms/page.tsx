import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Varsity Nest',
  description: 'Terms of Service for Varsity Nest - University accommodation platform',
}

// Terms of Service page.
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
            <p className="text-neutral-300 text-lg">Last Updated: September 2025</p>
          </div>

          {/* Terms Content */}
          <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300">
            <div className="prose prose-invert max-w-none">
              <p className="text-neutral-300 text-lg mb-8">
                Welcome to Varsity Nest. By accessing and using our services, you agree to comply with and be bound by the following Terms of Service (TOS). Please read them carefully.
              </p>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">1. Acceptance of Terms</h2>
                <p className="text-neutral-300 leading-relaxed">
                  By using the Varsity Nest platform, including any related websites, mobile applications, services, or features (collectively referred to as "the Service"), you agree to these Terms of Service. If you do not agree to these terms, you must immediately discontinue use of the Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">2. Changes to Terms</h2>
                <p className="text-neutral-300 leading-relaxed">
                  Varsity Nest reserves the right to modify, amend, or update these Terms of Service at any time. All changes will be posted on this page, and the "Last Updated" date will reflect the date of the most recent changes. It is your responsibility to review these terms periodically.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">3. Eligibility</h2>
                <p className="text-neutral-300 leading-relaxed">
                  You must be a registered student at a university or institution to use Varsity Nest services. By agreeing to these terms, you affirm that you meet this eligibility requirement.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">4. Account Registration</h2>
                <ul className="text-neutral-300 leading-relaxed space-y-2">
                  <li>• You are required to create an account to use the full features of Varsity Nest.</li>
                  <li>• You agree to provide accurate, complete, and up-to-date information during the registration process.</li>
                  <li>• You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account.</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">5. Use of Service</h2>
                <p className="text-neutral-300 leading-relaxed mb-4">
                  Varsity Nest provides a platform for university students to access accommodation listings and related services. You agree to use the Service in accordance with all applicable laws and regulations and not to misuse or disrupt the Service in any way.
                </p>
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-400 mb-2">Prohibited Actions:</h3>
                  <ul className="text-neutral-300 space-y-1">
                    <li>• <strong>Illegal Activities:</strong> You agree not to engage in any unlawful activities while using Varsity Nest, including but not limited to fraud, theft, harassment, or violation of intellectual property rights.</li>
                    <li>• <strong>Abuse or Misuse:</strong> You may not use the platform to spam, abuse, or otherwise mislead other users.</li>
                    <li>• <strong>Impersonation:</strong> You may not impersonate any person or entity, or falsely state or otherwise mislead others regarding your affiliation with any person or entity.</li>
                  </ul>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">6. Privacy Policy</h2>
                <p className="text-neutral-300 leading-relaxed">
                  Your use of the Service is also governed by our Privacy Policy, which outlines how we collect, use, and protect your personal information. By using Varsity Nest, you agree to the practices described in the Privacy Policy.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">7. Data Protection & GDPR Compliance</h2>
                <p className="text-neutral-300 leading-relaxed">
                  We are committed to protecting your personal data in accordance with applicable data protection laws. We collect, process, and store your personal information only as necessary to provide our services and in compliance with our Privacy Policy. You have the right to access, correct, or delete your personal data at any time.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">8. Fees and Payment</h2>
                <p className="text-neutral-300 leading-relaxed mb-4">
                  Certain features or services on Varsity Nest may require payment. You agree to pay all applicable fees for these services and any other charges incurred through your account. All payments are processed securely through PayFast, and you agree to comply with the payment terms outlined.
                </p>
                <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-red-400 mb-2">No Refund Policy:</h3>
                  <p className="text-neutral-300">
                    <strong>ALL SALES ARE FINAL.</strong> By clicking "Accept" or "Agree" to any service or payment, you acknowledge that no refunds will be provided under any circumstances. Refunds will only be considered in cases of technical errors resulting in duplicate or unauthorized charges, which must be reported within 24 hours of the transaction.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">9. Service Availability</h2>
                <p className="text-neutral-300 leading-relaxed">
                  While we strive to maintain continuous service availability, Varsity Nest may experience downtime for maintenance, updates, or technical issues. We do not guarantee uninterrupted service and are not liable for any service interruptions.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">10. Intellectual Property Rights</h2>
                <p className="text-neutral-300 leading-relaxed">
                  All content, logos, trademarks, and other intellectual property provided through the Service are owned by Varsity Nest or its licensors and are protected by intellectual property laws. You may not use or reproduce any content from the Service without prior written permission.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">11. User-Generated Content</h2>
                <p className="text-neutral-300 leading-relaxed mb-4">
                  You may submit reviews, listings, or other content to the Service. By submitting content, you grant Varsity Nest a non-exclusive, royalty-free license to use, modify, and display the content for the purpose of operating the Service.
                </p>
                <p className="text-neutral-300 leading-relaxed">
                  You represent and warrant that you have the necessary rights to submit the content and that it does not violate any third-party rights or laws. We reserve the right to moderate, edit, or remove any user-generated content that violates these terms.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">12. Third-Party Services</h2>
                <p className="text-neutral-300 leading-relaxed">
                  Varsity Nest integrates with third-party services including StackAuth for authentication and PayFast for payments. Your use of these services is subject to their respective terms of service and privacy policies. We are not responsible for the actions or policies of these third-party services.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">13. Disclaimers and Limitation of Liability</h2>
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-2">No Warranties:</h3>
                  <p className="text-neutral-300">
                    The Service is provided "as is" without any warranties or guarantees. Varsity Nest does not guarantee that the Service will be error-free, uninterrupted, or secure.
                  </p>
                </div>
                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-yellow-400 mb-2">Limitation of Liability:</h3>
                  <p className="text-neutral-300">
                    Varsity Nest is not liable for any indirect, incidental, or consequential damages arising from your use of the Service. Our total liability is limited to the amount you have paid for the Service.
                  </p>
                </div>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">14. Termination and Suspension</h2>
                <p className="text-neutral-300 leading-relaxed">
                  Varsity Nest reserves the right to suspend or terminate your account and access to the Service if you violate these Terms of Service or for any other reason deemed appropriate by Varsity Nest.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">15. Dispute Resolution</h2>
                <p className="text-neutral-300 leading-relaxed">
                  Before pursuing any legal action, you agree to first attempt to resolve any disputes through good faith negotiations. If a resolution cannot be reached, disputes will be resolved through binding arbitration in accordance with the rules of the South African Arbitration Foundation.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">16. Indemnification</h2>
                <p className="text-neutral-300 leading-relaxed">
                  You agree to indemnify and hold harmless Varsity Nest, its employees, affiliates, and partners from any claims, damages, or expenses arising from your use of the Service or any violation of these Terms of Service.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">17. Governing Law</h2>
                <p className="text-neutral-300 leading-relaxed">
                  These Terms of Service are governed by and construed in accordance with the laws of South Africa. Any disputes arising from or related to these Terms shall be resolved in the courts of South Africa.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">18. Severability</h2>
                <p className="text-neutral-300 leading-relaxed">
                  If any provision of these Terms of Service is found to be invalid or unenforceable, the remainder of the terms will remain in full effect.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">19. Contact Information</h2>
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-neutral-300 mb-2">
                    If you have any questions or concerns regarding these Terms of Service, please contact us at:
                  </p>
                  <p className="text-blue-300 font-medium">support@varsitynest.co.za</p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
