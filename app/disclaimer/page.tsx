import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Disclaimer | Varsity Nest',
  description: 'Disclaimer for Varsity Nest - Important information about the platform and accommodation listings',
  alternates: { canonical: 'https://varsitynest.space/disclaimer' },
  openGraph: {
    title: 'Disclaimer | Varsity Nest',
    description: 'Disclaimer for Varsity Nest - Important information about the platform and accommodation listings',
    url: 'https://varsitynest.space/disclaimer',
    siteName: 'Varsity Nest',
    type: 'website',
    images: ['/images/logo.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Disclaimer | Varsity Nest',
    description: 'Disclaimer for Varsity Nest - Important information about the platform and accommodation listings',
    images: ['/images/logo.png'],
  },
}

// Disclaimer page with comprehensive legal protections
export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#02042b] to-[#040945] px-4 py-12">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl tracking-tight">
            Disclaimer
          </h1>
          <p className="text-neutral-300 text-base">Last Updated: November 2025</p>
        </div>

        {/* Disclaimer Content */}
        <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl p-10 text-white shadow-2xl shadow-blue-500/20">
            <div className="prose prose-invert max-w-none">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5 mb-10">
                <p className="text-yellow-300 font-semibold text-base mb-2">Important Notice:</p>
                <p className="text-neutral-300 text-base">
                  The information provided on Varsity Nest is for general informational purposes only. All accommodation listings, accreditation claims, pricing, and other details are submitted by providers and have not been independently verified by Varsity Nest.
                </p>
              </div>

              <p className="text-neutral-300 text-base mb-10 leading-relaxed">
                This Disclaimer contains important information about the use of Varsity Nest, operated by Massive Operations (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). By accessing and using this platform, you acknowledge and agree to the terms set forth in this Disclaimer. Please read this carefully before using our services.
              </p>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">1. No Verification of Information</h2>
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 mb-5">
                  <p className="text-neutral-300 text-base mb-3">
                    <strong className="text-red-400">Varsity Nest does not verify, validate, or endorse any information provided by accommodation providers.</strong> This includes, but is not limited to:
                  </p>
                  <ul className="text-neutral-300 space-y-2 text-base ml-6">
                    <li>• Accreditation status and claims</li>
                    <li>• Accommodation descriptions, amenities, and features</li>
                    <li>• Pricing information and availability</li>
                    <li>• Provider credentials and certifications</li>
                    <li>• Property images and specifications</li>
                    <li>• University or institutional affiliations</li>
                    <li>• Business registration and licensing information</li>
                  </ul>
                </div>
                <p className="text-neutral-300 leading-relaxed text-base">
                  All information displayed on Varsity Nest is provided by the accommodation providers themselves. Varsity Nest acts solely as a platform to facilitate connections between students and providers, and does not assume responsibility for the accuracy, completeness, or truthfulness of any provider-submitted information.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">2. Accreditation Claims</h2>
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-5 mb-5">
                  <p className="text-orange-300 font-semibold text-base mb-3">Critical Warning Regarding Accreditation:</p>
                  <p className="text-neutral-300 text-base mb-3">
                    <strong>All accreditation claims, including but not limited to claims of accreditation by the University of the Free State (UFS), Central University of Technology (CUT), or any other institution, are made solely by the accommodation providers and have NOT been verified by Varsity Nest.</strong>
                  </p>
                  <p className="text-neutral-300 text-base">
                    Varsity Nest does not endorse, verify, or guarantee the accreditation status of any accommodation provider. Users are strongly encouraged to independently verify all accreditation claims directly with the relevant institutions or accrediting bodies before making any decisions or entering into any agreements.
                  </p>
                </div>
                <p className="text-neutral-300 leading-relaxed mb-4 text-base">
                  If a provider claims to be accredited by an institution, that claim is based solely on information provided by the provider. Varsity Nest has not conducted any independent verification of such claims and cannot guarantee their accuracy. Any reliance on such accreditation claims is at your own risk.
                </p>
                <p className="text-neutral-300 leading-relaxed text-base">
                  <strong>You are strongly advised to:</strong>
                </p>
                <ul className="text-neutral-300 space-y-2 text-base ml-6 mt-4">
                  <li>• Contact the relevant university or institution directly to verify accreditation status</li>
                  <li>• Request documentation from providers proving their accreditation</li>
                  <li>• Verify accreditation with the official accrediting bodies</li>
                  <li>• Perform your own due diligence before making any accommodation decisions</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">3. No Warranty or Guarantee</h2>
                <p className="text-neutral-300 leading-relaxed mb-4 text-base">
                  Varsity Nest provides this platform &quot;as is&quot; and &quot;as available&quot; without any warranties, representations, or guarantees of any kind, whether express or implied. We do not warrant or guarantee:
                </p>
                <ul className="text-neutral-300 space-y-2 text-base ml-6 mb-4">
                  <li>• The accuracy, completeness, or reliability of any information provided by providers</li>
                  <li>• The quality, safety, or suitability of any accommodation listed on the platform</li>
                  <li>• The accreditation status of any provider</li>
                  <li>• The availability of any accommodation at any given time</li>
                  <li>• The pricing information provided by providers</li>
                  <li>• The conduct or practices of any accommodation provider</li>
                </ul>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5">
                  <p className="text-neutral-300 text-base">
                    <strong className="text-yellow-400">You use this platform at your own risk.</strong> Varsity Nest makes no representations or warranties regarding the accuracy, reliability, or completeness of any information on this platform, and shall not be liable for any errors, omissions, or inaccuracies in the content provided.
                  </p>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">4. Third-Party Content and Provider Responsibilities</h2>
                <p className="text-neutral-300 leading-relaxed mb-4 text-base">
                  All accommodation listings, descriptions, images, pricing information, and other content on Varsity Nest are created and submitted by third-party accommodation providers. Varsity Nest does not create, control, or edit this content, except as necessary to maintain platform functionality.
                </p>
                <p className="text-neutral-300 leading-relaxed mb-4 text-base">
                  Accommodation providers are solely responsible for:
                </p>
                <ul className="text-neutral-300 space-y-2 text-base ml-6 mb-4">
                  <li>• The accuracy and truthfulness of all information they provide</li>
                  <li>• Verifying and maintaining their accreditation status</li>
                  <li>• Ensuring compliance with all applicable laws and regulations</li>
                  <li>• The quality, safety, and condition of their accommodations</li>
                  <li>• All interactions and agreements with students</li>
                  <li>• Any misrepresentations or false claims made in their listings</li>
                </ul>
                <p className="text-neutral-300 leading-relaxed text-base">
                  Varsity Nest disclaims any responsibility for the content, accuracy, or conduct of accommodation providers. Any disputes, issues, or claims arising from provider misrepresentations, false accreditation claims, or inaccurate information are matters between users and providers, and Varsity Nest shall not be a party to such disputes.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">5. Limitation of Liability</h2>
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 mb-5">
                  <p className="text-red-300 font-semibold text-base mb-3">Important Limitation:</p>
                  <p className="text-neutral-300 text-base">
                    To the fullest extent permitted by law, Massive Operations (operating as Varsity Nest), its owners, employees, affiliates, partners, and agents shall not be liable for any direct, indirect, incidental, consequential, special, punitive, or exemplary damages arising from or relating to:
                  </p>
                </div>
                <ul className="text-neutral-300 space-y-2 text-base ml-6 mb-4">
                  <li>• Any inaccuracies, errors, or omissions in provider-submitted information</li>
                  <li>• False or misleading accreditation claims made by providers</li>
                  <li>• Provider misrepresentations or fraudulent conduct</li>
                  <li>• Loss or damage resulting from accommodation bookings or arrangements</li>
                  <li>• Disputes between users and accommodation providers</li>
                  <li>• Personal injury, property damage, or financial loss resulting from accommodation stays</li>
                  <li>• Any reliance on unverified information displayed on the platform</li>
                  <li>• Platform downtime, errors, or technical issues</li>
                </ul>
                <p className="text-neutral-300 leading-relaxed text-base">
                  This limitation of liability applies regardless of the theory of liability (contract, tort, negligence, strict liability, or otherwise) and even if Varsity Nest has been advised of the possibility of such damages.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">6. User Responsibility and Due Diligence</h2>
                <p className="text-neutral-300 leading-relaxed mb-4 text-base">
                  <strong>You acknowledge and agree that you are solely responsible for:</strong>
                </p>
                <ul className="text-neutral-300 space-y-3 text-base ml-6 mb-4">
                  <li>• <strong>Verifying all information:</strong> You must independently verify all information provided by accommodation providers, including but not limited to accreditation claims, pricing, availability, amenities, and property conditions.</li>
                  <li>• <strong>Conducting due diligence:</strong> Before entering into any agreement or making any payment, you should conduct your own thorough research and due diligence regarding accommodation providers and their claims.</li>
                  <li>• <strong>Verifying accreditation:</strong> If accreditation is important to you, you must verify accreditation claims directly with the relevant institutions or accrediting bodies. Do not rely solely on information displayed on Varsity Nest.</li>
                  <li>• <strong>Inspecting accommodations:</strong> When possible, you should personally inspect accommodations before booking or agreeing to stay, or obtain independent verification of property conditions.</li>
                  <li>• <strong>Reviewing agreements:</strong> Carefully review all terms, conditions, and agreements with accommodation providers before committing to any arrangement.</li>
                  <li>• <strong>Making informed decisions:</strong> Base your accommodation decisions on verified information and your own independent judgment, not solely on information displayed on Varsity Nest.</li>
                </ul>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
                  <p className="text-blue-300 font-semibold text-base mb-3">Recommendation:</p>
                  <p className="text-neutral-300 text-base">
                    We strongly encourage all users to verify accreditation claims, inspect accommodations, review documentation, and conduct independent research before making any accommodation decisions. When in doubt, consult directly with the relevant institutions or seek professional advice.
                  </p>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">7. No Endorsement or Recommendation</h2>
                <p className="text-neutral-300 leading-relaxed mb-4 text-base">
                  The presence of an accommodation listing on Varsity Nest does not constitute an endorsement, recommendation, or guarantee by Varsity Nest of that provider, their services, or their claims. Varsity Nest does not endorse, recommend, or favor any particular accommodation provider over another.
                </p>
                <p className="text-neutral-300 leading-relaxed text-base">
                  Listings are displayed based on provider submissions and platform functionality, not based on Varsity Nest&apos;s assessment, verification, or recommendation of providers. The inclusion of a listing on our platform should not be interpreted as an indication of quality, reliability, or legitimacy.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">8. No Liability for Provider Conduct</h2>
                <p className="text-neutral-300 leading-relaxed mb-4 text-base">
                  Varsity Nest is not responsible for, and disclaims all liability for, the conduct, practices, representations, or actions of accommodation providers. This includes, but is not limited to:
                </p>
                <ul className="text-neutral-300 space-y-2 text-base ml-6 mb-4">
                  <li>• False or misleading accreditation claims</li>
                  <li>• Misrepresentation of accommodation features, amenities, or conditions</li>
                  <li>• Fraudulent or deceptive business practices</li>
                  <li>• Breach of contract or agreement between users and providers</li>
                  <li>• Unsafe or substandard accommodation conditions</li>
                  <li>• Pricing disputes or hidden fees</li>
                  <li>• Any other misconduct or violation of law by providers</li>
                </ul>
                <p className="text-neutral-300 leading-relaxed text-base">
                  Any legal action, claims, or disputes arising from provider conduct must be directed to the provider directly, not to Varsity Nest. Varsity Nest is not a party to, and bears no responsibility for, any agreements or disputes between users and providers.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">9. Information Accuracy and Updates</h2>
                <p className="text-neutral-300 leading-relaxed mb-4 text-base">
                  Information on Varsity Nest is provided by accommodation providers and may change at any time without notice. Varsity Nest does not guarantee that information will be current, accurate, or complete at all times.
                </p>
                <p className="text-neutral-300 leading-relaxed text-base">
                  Users should verify all current information directly with accommodation providers, including but not limited to:
                </p>
                <ul className="text-neutral-300 space-y-2 text-base ml-6 mb-4">
                  <li>• Current availability and pricing</li>
                  <li>• Accreditation status and validity</li>
                  <li>• Property conditions and amenities</li>
                  <li>• Terms and conditions of stay</li>
                  <li>• Any other information relevant to accommodation decisions</li>
                </ul>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">10. Platform Functionality</h2>
                <p className="text-neutral-300 leading-relaxed text-base">
                  While Varsity Nest strives to maintain platform functionality and accessibility, we do not guarantee uninterrupted, error-free, or secure access to the platform. Varsity Nest is not liable for any technical issues, downtime, errors, or security breaches that may affect your use of the platform.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">11. Reporting Misrepresentations</h2>
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 mb-5">
                  <p className="text-green-300 font-semibold text-base mb-3">How to Report Issues:</p>
                  <p className="text-neutral-300 text-base mb-3">
                    If you believe that an accommodation provider has made false or misleading claims, including false accreditation claims, please report this to Varsity Nest immediately. However, please note that:
                  </p>
                  <ul className="text-neutral-300 space-y-2 text-base ml-6">
                    <li>• Reporting does not guarantee immediate action or removal of listings</li>
                    <li>• Varsity Nest is not obligated to investigate or act on reports</li>
                    <li>• Removal of a listing does not constitute an admission of wrongdoing by Varsity Nest</li>
                    <li>• You should also report fraudulent or illegal conduct to the relevant authorities</li>
                  </ul>
                </div>
                <p className="text-neutral-300 leading-relaxed text-base">
                  While Varsity Nest may, in its sole discretion, investigate reports of misrepresentation and take appropriate action, including removal of listings or suspension of provider accounts, we are under no obligation to do so and bear no liability for any delays or decisions regarding such reports.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">12. Acceptance of Risk</h2>
                <p className="text-neutral-300 leading-relaxed mb-4 text-base">
                  By using Varsity Nest, you acknowledge and accept that:
                </p>
                <ul className="text-neutral-300 space-y-3 text-base ml-6 mb-4">
                  <li>• All information on the platform is provided &quot;as is&quot; without verification</li>
                  <li>• Accreditation claims and other provider information have not been independently verified</li>
                  <li>• You assume full responsibility for verifying all information and making informed decisions</li>
                  <li>• You use the platform at your own risk</li>
                  <li>• Varsity Nest is not liable for any consequences resulting from your use of the platform or reliance on unverified information</li>
                </ul>
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
                  <p className="text-red-300 font-semibold text-base mb-3">Final Warning:</p>
                  <p className="text-neutral-300 text-base">
                    <strong>Varsity Nest explicitly disclaims all responsibility for provider misrepresentations, false accreditation claims, inaccurate information, or any other issues arising from provider-submitted content. Your use of this platform constitutes acceptance of these risks.</strong>
                  </p>
                </div>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">13. Changes to This Disclaimer</h2>
                <p className="text-neutral-300 leading-relaxed text-base">
                  Massive Operations reserves the right to modify, update, or change this Disclaimer at any time without prior notice. It is your responsibility to review this Disclaimer periodically to stay informed about our disclaimers and limitations of liability. Continued use of the platform after changes to this Disclaimer constitutes acceptance of the updated terms.
                </p>
              </section>

              <section className="mb-10">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-5">14. Contact Information</h2>
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-5">
                  <p className="text-neutral-300 mb-3 text-base">
                    If you have any questions about this Disclaimer or need to report misrepresentations or false claims by accommodation providers, please contact Massive Operations at:
                  </p>
                  <div className="space-y-2 text-base">
                    <p className="text-blue-300 font-semibold">Email: support@varsitynest.co.za</p>
                    <p className="text-blue-300 font-semibold">Phone: +27 62 407 9139</p>
                    <p className="text-blue-300 font-semibold">Address: Bloemfontein, 9300, South Africa</p>
                    <p className="text-blue-300 font-semibold">Company: Massive Operations (operating as Varsity Nest)</p>
                  </div>
                </div>
              </section>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6 mt-10">
                <p className="text-yellow-300 font-bold text-lg mb-3">Legal Acknowledgment:</p>
                <p className="text-neutral-300 text-base leading-relaxed">
                  By using Varsity Nest, you acknowledge that you have read, understood, and agree to be bound by this Disclaimer. If you do not agree to any part of this Disclaimer, you must immediately discontinue use of the platform. This Disclaimer is legally binding and forms part of your agreement with Massive Operations, operating as Varsity Nest.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
  )
}

