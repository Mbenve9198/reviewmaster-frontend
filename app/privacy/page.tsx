import React from 'react'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Replai',
  description: 'Privacy Policy for Replai Chrome Extension and Web Application'
}

export default function PrivacyPage() {
  return (
    <div className="container max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy for Replai Chrome Extension</h1>
      <div className="prose prose-blue max-w-none space-y-8">
        <p className="text-gray-600">Last updated: January 8, 2025</p>

        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>
            Marco Benvenuti ("we," "us," or "our") operates the Replai Chrome Extension and associated services at replai.app. 
            This Privacy Policy informs you of our policies regarding the collection, use, and disclosure of personal data when 
            you use our Extension and the choices you have associated with that data.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Information Collection and Use</h2>
          <h3 className="text-xl font-medium mb-2">2.1 Data Collected Through the Extension</h3>
          <ul className="list-disc pl-6 mb-4">
            <li>Authentication Information: Login credentials and authentication tokens</li>
            <li>Website Content: Review content from supported platforms that you interact with</li>
            <li>Web History: Limited to URLs of review pages on supported platforms</li>
          </ul>

          <h3 className="text-xl font-medium mb-2">2.2 Technical Data</h3>
          <ul className="list-disc pl-6">
            <li>Browser type and version</li>
            <li>Extension installation and usage data</li>
            <li>Error logs and performance data</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Use of Data</h2>
          <p>We use the collected data for the following purposes:</p>
          <ul className="list-disc pl-6">
            <li>To provide and maintain our service</li>
            <li>To detect when you are viewing supported review platforms</li>
            <li>To generate AI-powered review responses</li>
            <li>To notify you about changes to our service</li>
            <li>To provide customer support</li>
            <li>To prevent technical issues</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Data Processing and Storage</h2>
          <ul className="list-disc pl-6">
            <li>All data is stored on secure MongoDB databases in EU-compliant regions</li>
            <li>We use Anthropic's Claude AI service to process review responses</li>
            <li>Data is retained only as long as necessary to provide our services</li>
            <li>You can request data deletion at any time</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">5. GDPR Compliance</h2>
          <p>Under the General Data Protection Regulation (GDPR), you have the following rights:</p>
          <ul className="list-disc pl-6">
            <li>Right to access your data</li>
            <li>Right to rectify your data</li>
            <li>Right to erase your data</li>
            <li>Right to restrict processing</li>
            <li>Right to data portability</li>
            <li>Right to object to processing</li>
          </ul>
          <p className="mt-4">
            To exercise any of these rights, please contact us at marco@midachat.com
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
          <p>We implement appropriate technical and organizational measures to maintain the security of your personal data, including:</p>
          <ul className="list-disc pl-6">
            <li>Encryption of data in transit and at rest</li>
            <li>Regular security assessments</li>
            <li>Access control and authentication mechanisms</li>
            <li>Regular security updates</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">7. Third-Party Services</h2>
          <p>We use the following third-party services:</p>
          <ul className="list-disc pl-6">
            <li>Anthropic Claude AI for review response generation</li>
            <li>MongoDB for data storage</li>
            <li>Render for hosting services</li>
          </ul>
          <p className="mt-4">
            Each of these providers has been selected for their commitment to data security and privacy.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">8. Data Retention</h2>
          <p>
            We retain your data for as long as your account is active or as needed to provide you services. 
            You can request deletion of your account and associated data at any time by contacting us.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">9. Children's Privacy</h2>
          <p>
            Our Service does not address anyone under the age of 18 ("Children"). 
            We do not knowingly collect personally identifiable information from anyone under the age of 18.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">10. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting 
            the new Privacy Policy on this page and updating the "Last updated" date.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, please contact us:</p>
          <ul className="list-none pl-6">
            <li>By email: marco@midachat.com</li>
            <li>By visiting our website: https://replai.app</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">12. Cookie Policy</h2>
          <p>
            Our Extension uses cookies and similar tracking technologies to track activity and store certain information. 
            Cookies are files with a small amount of data which may include an anonymous unique identifier.
          </p>
          <p className="mt-4">
            You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. 
            However, if you do not accept cookies, you may not be able to use some portions of our Service.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">13. Consent</h2>
          <p>
            By using our Extension and services, you consent to our Privacy Policy and agree to its terms.
          </p>
        </section>

        <footer className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-600">
            For any questions about this Privacy Policy, please contact us at:
            <br />
            Email: marco@midachat.com
            <br />
            Website: https://replai.app
          </p>
        </footer>
      </div>
    </div>
  )
} 