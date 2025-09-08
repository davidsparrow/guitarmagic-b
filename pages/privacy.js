// pages/privacy.js - Privacy Policy Page
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import AuthModal from '../components/AuthModal'
import MenuModal from '../components/MenuModal'
import Header from '../components/Header'
import Footer from '../components/Footer'
import { useRouter } from 'next/router'

export default function PrivacyPolicy() {
  const { isAuthenticated, user, profile, loading, signOut } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)
  const [showMenuModal, setShowMenuModal] = useState(false)
  const footerRef = useRef()
  const router = useRouter()

  // Prevent hydration issues
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle login/logout
  const handleAuthClick = async () => {
    if (isAuthenticated) {
      try {
        await signOut()
        setShowAuthModal(false)
        setShowMenuModal(false)
      } catch (error) {
        console.error('Sign out failed:', error)
      }
    } else {
      setShowAuthModal(true)
    }
  }

  if (!mounted || (loading && !router.isReady)) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    )
  }

  return (
    <div className="relative h-screen overflow-hidden bg-black" style={{ 
      backgroundColor: '#000000',
      minHeight: '100vh',
      width: '100vw',
      overflow: 'hidden'
    }}>
      {/* Full-Screen Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/images/dark_guitarPink.png')`,
          width: '100vw',
          height: '100vh'
        }}
      />
      
      {/* Header Component */}
      <Header 
        showBrainIcon={false}
        showSearchIcon={false}
        onAuthClick={handleAuthClick}
        onMenuClick={() => setShowMenuModal(true)}
        isAuthenticated={isAuthenticated}
      />

      {/* Main Content - Privacy Policy */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 mt-16 md:mt-20" style={{ 
        height: 'calc(100vh - 120px)',
        backgroundColor: 'transparent'
      }}>
        <div className="max-w-4xl w-full rounded-2xl p-8 text-white overflow-y-auto max-h-full" style={{ 
          fontFamily: 'Futura, sans-serif',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0, 0, 0, 0.3) transparent'
        }}>
          <h1 className="text-4xl font-bold text-center mb-8 text-yellow-400">Privacy Policy</h1>
          
          <div className="space-y-6 text-lg leading-relaxed">
            <p className="text-center text-yellow-300 font-semibold">
              <strong>Effective Date: January 1, 2025</strong>
            </p>
            
            <p>
              GuitarTube is committed to protecting your privacy and creating a safe, educational environment for musicians of all ages. 
              This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our family-friendly music learning website, 
              mobile applications, and services (collectively, the "Service").
            </p>
            
            <div className="bg-green-400/20 p-4 rounded-lg border border-green-400/30">
              <p className="text-green-300 text-center font-semibold">
                <strong>We welcome learners of all ages and are committed to compliance with children's privacy laws including COPPA (Children's Online Privacy Protection Act).</strong>
              </p>
            </div>
            
            <div className="bg-yellow-400/20 p-4 rounded-lg border border-yellow-400/30">
              <p className="text-yellow-300 text-center font-semibold">
                <strong>Please read this Privacy Policy carefully. If you do not agree with the terms of this Privacy Policy, please do not access the Service.</strong>
              </p>
            </div>
            
            <div className="space-y-6">
              <section>
                <h2 className="text-2xl font-semibold text-yellow-300 mb-4">1. INFORMATION WE COLLECT</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-yellow-200 mb-2">1.1 Personal Information You Provide</h3>
                    <p>When you register for an account or use our Service, we may collect:</p>
                    <div className="ml-6 mt-2 space-y-2">
                      <div>
                        <h4 className="text-lg font-semibold text-yellow-100">Account Information:</h4>
                        <ul className="ml-6 space-y-1">
                          <li>• Email address and username</li>
                          <li>• Full name (optional)</li>
                          <li>• Profile picture/avatar</li>
                          <li>• Password (encrypted and hashed)</li>
                          <li>• Date of birth (for age-appropriate features and COPPA compliance)</li>
                          <li>• Parental contact information and consent (for users under 13)</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-yellow-100">Payment Information:</h4>
                        <ul className="ml-6 space-y-1">
                          <li>• Billing address and contact information</li>
                          <li>• Payment method details (processed securely through Stripe)</li>
                          <li>• Tax identification information for creators (W-9/W-8 forms)</li>
                          <li>• Bank account details for revenue payouts</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-yellow-200 mb-2">1.2 Content and Usage Data</h3>
                    <div className="ml-6 space-y-2">
                      <div>
                        <h4 className="text-lg font-semibold text-yellow-100">User-Generated Content:</h4>
                        <ul className="ml-6 space-y-1">
                          <li>• Custom video captions and annotations</li>
                          <li>• Chord charts and musical notations created using our tools</li>
                          <li>• Custom practice loops and saved video segments</li>
                          <li>• Comments, ratings, and reviews</li>
                          <li>• Search queries and saved searches</li>
                          <li>• Playlist and favorite video collections</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-yellow-100">Platform Usage Analytics:</h4>
                        <ul className="ml-6 space-y-1">
                          <li>• Video watch time and viewing patterns</li>
                          <li>• Feature usage and interaction data</li>
                          <li>• Search behavior and preferences</li>
                          <li>• Loop creation and usage statistics</li>
                          <li>• Timeline position and session resume data</li>
                          <li>• Device and browser information</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-yellow-200 mb-2">1.3 Automatically Collected Information</h3>
                    <div className="ml-6 space-y-2">
                      <div>
                        <h4 className="text-lg font-semibold text-yellow-100">Technical Data:</h4>
                        <ul className="ml-6 space-y-1">
                          <li>• IP address and geolocation (city/country level)</li>
                          <li>• Device type, operating system, and browser information</li>
                          <li>• Screen resolution and device specifications</li>
                          <li>• Referral URLs and page navigation paths</li>
                          <li>• Session duration and activity timestamps</li>
                          <li>• Error logs and crash reports</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-yellow-100">Cookies and Tracking Technologies:</h4>
                        <ul className="ml-6 space-y-1">
                          <li>• Essential cookies for authentication and session management</li>
                          <li>• Analytics cookies to understand user behavior</li>
                          <li>• Preference cookies to remember your settings</li>
                          <li>• Performance cookies to optimize Service functionality</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-yellow-300 mb-4">2. HOW WE USE YOUR INFORMATION</h2>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-yellow-200 mb-2">2.1 Core Service Operations</h3>
                  <ul className="ml-6 space-y-1">
                    <li>• <strong>Provide and maintain the Service</strong> including video playback, custom loops, and caption tools</li>
                    <li>• <strong>Process payments and subscriptions</strong> through our payment processor Stripe</li>
                    <li>• <strong>Authenticate users and manage accounts</strong> using Supabase authentication</li>
                    <li>• <strong>Enable content creation tools</strong> including chord charts and timeline annotations</li>
                    <li>• <strong>Save and sync user preferences</strong> across devices and sessions</li>
                  </ul>
                </div>
                
                <div className="space-y-3 mt-4">
                  <h3 className="text-xl font-semibold text-yellow-200 mb-2">2.2 Creator Revenue Sharing Program</h3>
                  <ul className="ml-6 space-y-1">
                    <li>• <strong>Calculate watch time and engagement metrics</strong> for creator payouts</li>
                    <li>• <strong>Generate monthly creator leaderboards</strong> and ranking systems</li>
                    <li>• <strong>Process revenue sharing payments</strong> to eligible creators</li>
                    <li>• <strong>Maintain tax compliance records</strong> and generate necessary tax documents</li>
                    <li>• <strong>Track creator performance analytics</strong> for program optimization</li>
                  </ul>
                </div>
                
                <div className="space-y-3 mt-4">
                  <h3 className="text-xl font-semibold text-yellow-200 mb-2">2.3 Platform Improvement</h3>
                  <ul className="ml-6 space-y-1">
                    <li>• <strong>Analyze usage patterns</strong> to improve features and user experience</li>
                    <li>• <strong>Develop new features</strong> based on user behavior and feedback</li>
                    <li>• <strong>Optimize video loading and streaming</strong> performance</li>
                    <li>• <strong>Enhance search algorithms</strong> and content discovery</li>
                    <li>• <strong>Debug technical issues</strong> and improve Service stability</li>
                  </ul>
                </div>
                
                <div className="space-y-3 mt-4">
                  <h3 className="text-xl font-semibold text-yellow-200 mb-2">2.4 Communication and Marketing</h3>
                  <ul className="ml-6 space-y-1">
                    <li>• <strong>Send important Service announcements</strong> and updates</li>
                    <li>• <strong>Provide customer support</strong> and respond to inquiries</li>
                    <li>• <strong>Share product updates</strong> and new feature releases</li>
                    <li>• <strong>Send promotional emails</strong> (with your consent, opt-out available)</li>
                    <li>• <strong>Conduct user research</strong> and satisfaction surveys</li>
                  </ul>
                </div>
                
                <div className="space-y-3 mt-4">
                  <h3 className="text-xl font-semibold text-yellow-200 mb-2">2.5 Age-Appropriate Features and Child Safety</h3>
                  <ul className="ml-6 space-y-1">
                    <li>• <strong>Provide age-appropriate content recommendations</strong> and learning materials</li>
                    <li>• <strong>Implement enhanced safety measures</strong> for users under 13</li>
                    <li>• <strong>Obtain and maintain parental consent</strong> for children's accounts</li>
                    <li>• <strong>Limit data collection</strong> for children to only what's necessary for the educational service</li>
                    <li>• <strong>Provide parental oversight tools</strong> and account management features</li>
                    <li>• <strong>Ensure COPPA compliance</strong> in all aspects of children's data handling</li>
                  </ul>
                </div>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-yellow-300 mb-4">3. INFORMATION SHARING AND DISCLOSURE</h2>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-yellow-200 mb-2">3.1 Third-Party Service Providers</h3>
                  <p>We share certain information with trusted third-party services that help us operate our platform:</p>
                  <div className="ml-6 space-y-2">
                    <div>
                      <h4 className="text-lg font-semibold text-yellow-100">YouTube/Google Services:</h4>
                      <ul className="ml-6 space-y-1">
                        <li>• Video IDs and playback data for integration with YouTube Player API</li>
                        <li>• Search queries sent to YouTube Data API for video discovery</li>
                        <li>• User interaction data with embedded YouTube videos</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-yellow-100">Stripe Payment Processing:</h4>
                      <ul className="ml-6 space-y-1">
                        <li>• Payment information, billing addresses, and transaction data</li>
                        <li>• Tax identification information for creator payouts</li>
                        <li>• Subscription status and billing history</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-yellow-300 mb-4">4. DATA RETENTION AND DELETION</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-semibold text-yellow-200 mb-2">4.1 Account Data Retention</h3>
                    <ul className="ml-6 space-y-1">
                      <li>• <strong>Active accounts</strong>: Data retained while your account is active</li>
                      <li>• <strong>Inactive accounts</strong>: Data may be deleted after 3 years of inactivity</li>
                      <li>• <strong>Closed accounts</strong>: Most data deleted within 30 days of account closure</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-yellow-200 mb-2">4.2 User Content Retention</h3>
                    <ul className="ml-6 space-y-1">
                      <li>• <strong>Active content</strong>: Retained while you maintain your account</li>
                      <li>• <strong>User-deleted content</strong>: <strong>Permanently deleted within 1 week</strong></li>
                      <li>• <strong>Content backups</strong>: <strong>No backups maintained longer than 1 week</strong></li>
                    </ul>
                  </div>
                </div>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-yellow-300 mb-4">5. YOUR PRIVACY RIGHTS AND CONTROLS</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-semibold text-yellow-200 mb-2">5.1 Account Management</h3>
                    <ul className="ml-6 space-y-1">
                      <li>• <strong>Access your personal data</strong> through your account dashboard</li>
                      <li>• <strong>Update or correct</strong> your profile information and preferences</li>
                      <li>• <strong>Download your data</strong> in portable formats</li>
                      <li>• <strong>Delete your account</strong> and associated data</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-yellow-200 mb-2">5.2 Content Controls</h3>
                    <ul className="ml-6 space-y-1">
                      <li>• <strong>Delete individual pieces of content</strong> (removed within 1 week)</li>
                      <li>• <strong>Make content private or public</strong> based on your preferences</li>
                      <li>• <strong>Control content sharing</strong> and promotional usage permissions</li>
                    </ul>
                  </div>
                </div>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-yellow-300 mb-4">6. DATA SECURITY</h2>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-yellow-200 mb-2">6.1 Security Measures</h3>
                  <p>We implement industry-standard security measures including:</p>
                  <ul className="ml-6 space-y-1">
                    <li>• <strong>Encryption</strong> of data in transit and at rest</li>
                    <li>• <strong>Secure authentication</strong> using industry best practices</li>
                    <li>• <strong>Regular security audits</strong> and vulnerability assessments</li>
                    <li>• <strong>Access controls</strong> limiting employee data access</li>
                  </ul>
                  <div className="bg-red-400/20 p-3 rounded-lg border border-red-400/30 mt-3">
                    <p className="text-red-300 text-sm">
                      <strong>Security Limitations:</strong> While we implement strong security measures, no system is 100% secure. 
                      We cannot guarantee absolute security of your data, especially when transmitted over the internet.
                    </p>
                  </div>
                </div>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-yellow-300 mb-4">7. CHILDREN'S PRIVACY AND FAMILY-FRIENDLY FEATURES</h2>
                <div className="space-y-4">
                  <div className="bg-green-400/20 p-3 rounded-lg border border-green-400/30">
                    <h3 className="text-xl font-semibold text-green-200 mb-2">7.1 All-Ages Music Education Platform</h3>
                    <p className="text-green-300">
                      <strong>GuitarTube welcomes users of all ages!</strong> We are committed to providing a safe, educational environment for young musicians to learn guitar and other instruments. Our platform is designed to be family-friendly and educationally focused.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-yellow-200 mb-2">7.2 COPPA Compliance for Children Under 13</h3>
                    <p>For users under 13 years old, we comply with the Children's Online Privacy Protection Act (COPPA):</p>
                    <div className="ml-6 space-y-2">
                      <div>
                        <h4 className="text-lg font-semibold text-yellow-100">Parental Consent Required:</h4>
                        <ul className="ml-6 space-y-1">
                          <li>• Parents must provide verifiable consent before children under 13 can create accounts</li>
                          <li>• Consent is obtained through email verification plus additional verification method</li>
                          <li>• Parents receive clear information about what data we collect and how it's used</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-yellow-100">Limited Data Collection for Children:</h4>
                        <ul className="ml-6 space-y-1">
                          <li>• We collect only information necessary for the educational service</li>
                          <li>• No behavioral advertising or tracking for children under 13</li>
                          <li>• No personal information shared with third parties except essential service providers</li>
                          <li>• Enhanced security measures for children's accounts</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-yellow-200 mb-2">7.3 Parental Controls and Oversight</h3>
                    <p><strong>Parents have full control over their child's experience:</strong></p>
                    <ul className="ml-6 space-y-1">
                      <li>• <strong>Account Management</strong>: Parents can review, modify, or delete their child's account at any time</li>
                      <li>• <strong>Data Access</strong>: Parents can request a copy of all data collected about their child</li>
                      <li>• <strong>Content Controls</strong>: Parents can review their child's created content (captions, chord charts, etc.)</li>
                      <li>• <strong>Communication Settings</strong>: Parents control all email communications and notifications</li>
                      <li>• <strong>Usage Monitoring</strong>: Parents can view their child's learning progress and platform usage</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-yellow-200 mb-2">7.4 Enhanced Safety for Young Users</h3>
                    <p><strong>Additional protections for all users under 18:</strong></p>
                    <ul className="ml-6 space-y-1">
                      <li>• <strong>No Direct Messaging</strong>: No user-to-user communication features that could enable inappropriate contact</li>
                      <li>• <strong>Moderated Content</strong>: All user-generated content is subject to safety review</li>
                      <li>• <strong>Educational Focus</strong>: Platform features prioritize learning and skill development</li>
                      <li>• <strong>Safe External Content</strong>: YouTube integration limited to music education and appropriate content</li>
                      <li>• <strong>Reporting System</strong>: Easy reporting tools for inappropriate content or safety concerns</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-yellow-200 mb-2">7.5 Parental Rights and Communication</h3>
                    <p><strong>Parents can contact us to:</strong></p>
                    <ul className="ml-6 space-y-1">
                      <li>• Review what information we have collected about their child</li>
                      <li>• Request deletion of their child's personal information</li>
                      <li>• Refuse to allow further collection or use of their child's information</li>
                      <li>• Ask questions about our privacy practices for children</li>
                    </ul>
                    
                    <div className="bg-blue-400/20 p-3 rounded-lg border border-blue-400/30 mt-3">
                      <h4 className="text-lg font-semibold text-blue-200 mb-2">Contact for Parental Inquiries:</h4>
                      <ul className="ml-6 space-y-1">
                        <li>• <strong>Email</strong>: parents@guitartube.com</li>
                        <li>• <strong>Subject Line</strong>: "Child Privacy Inquiry"</li>
                        <li>• <strong>Include</strong>: Child's registered email/username and your relationship to the child</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-yellow-300 mb-4">8. EDUCATIONAL USE AND FERPA CONSIDERATIONS</h2>
                <div className="space-y-3">
                  <div className="bg-blue-400/20 p-3 rounded-lg border border-blue-400/30">
                    <h3 className="text-xl font-semibold text-blue-200 mb-2">8.1 For Schools and Educational Institutions</h3>
                    <ul className="ml-6 space-y-1">
                      <li>• GuitarTube can be used as an educational tool in classrooms and music programs</li>
                      <li>• We do not collect "educational records" as defined by FERPA (Family Educational Rights and Privacy Act)</li>
                      <li>• Teachers and schools should obtain appropriate permissions before students use our platform</li>
                      <li>• We provide the same privacy protections regardless of whether use is personal or educational</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-yellow-200 mb-2">8.2 Educational Features</h3>
                    <ul className="ml-6 space-y-1">
                      <li>• Progress tracking for learning goals</li>
                      <li>• Safe environment for young musicians to practice and learn</li>
                      <li>• No social networking or communication features that could compromise student safety</li>
                      <li>• Focus on music education and skill development</li>
                    </ul>
                  </div>
                </div>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-yellow-300 mb-4">9. COOKIES AND TRACKING</h2>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-yellow-200 mb-2">9.1 Types of Cookies We Use</h3>
                  <ul className="ml-6 space-y-1">
                    <li>• <strong>Essential Cookies</strong>: Required for login, security, and core functionality</li>
                    <li>• <strong>Analytics Cookies</strong>: Help us understand how users interact with our Service</li>
                    <li>• <strong>Preference Cookies</strong>: Remember your settings and customizations</li>
                    <li>• <strong>Performance Cookies</strong>: Optimize loading times and Service performance</li>
                  </ul>
                </div>
                
                <div className="space-y-3 mt-4">
                  <h3 className="text-xl font-semibold text-yellow-200 mb-2">9.2 Cookie Management</h3>
                  <p>You can control cookies through:</p>
                  <ul className="ml-6 space-y-1">
                    <li>• Browser settings to block or delete cookies</li>
                    <li>• Opt-out links for analytics services</li>
                    <li>• Privacy preferences in your account settings</li>
                    <li>• Third-party cookie management tools</li>
                  </ul>
                </div>
                
                <div className="space-y-3 mt-4">
                  <h3 className="text-xl font-semibold text-yellow-200 mb-2">9.3 Impact of Disabling Cookies</h3>
                  <p>Disabling certain cookies may affect:</p>
                  <ul className="ml-6 space-y-1">
                    <li>• Login functionality and session management</li>
                    <li>• Personalized features and recommendations</li>
                    <li>• Performance optimization and error tracking</li>
                    <li>• Analytics and platform improvement capabilities</li>
                  </ul>
                </div>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-yellow-300 mb-4">10. CHANGES TO THIS PRIVACY POLICY</h2>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-yellow-200 mb-2">10.1 Policy Updates</h3>
                  <p>We may update this Privacy Policy to reflect:</p>
                  <ul className="ml-6 space-y-1">
                    <li>• Changes in our data practices</li>
                    <li>• New features or services</li>
                    <li>• Legal or regulatory requirements</li>
                    <li>• User feedback and platform improvements</li>
                  </ul>
                </div>
                
                <div className="space-y-3 mt-4">
                  <h3 className="text-xl font-semibold text-yellow-200 mb-2">10.2 Notification of Changes</h3>
                  <p><strong>Significant changes</strong> will be announced through:</p>
                  <ul className="ml-6 space-y-1">
                    <li>• Email notifications to registered users</li>
                    <li>• Prominent notices on our website</li>
                    <li>• In-app notifications for mobile users</li>
                    <li>• 30-day advance notice for major changes</li>
                  </ul>
                </div>
                
                <div className="space-y-3 mt-4">
                  <h3 className="text-xl font-semibold text-yellow-200 mb-2">10.3 Continued Use</h3>
                  <p>Your continued use of the Service after changes become effective constitutes acceptance of the updated Privacy Policy.</p>
                </div>
              </section>
              
              <section>
                <h2 className="text-2xl font-semibold text-yellow-300 mb-4">11. CONTACT INFORMATION</h2>
                <div className="space-y-3">
                  <div>
                    <h3 className="text-xl font-semibold text-yellow-200 mb-2">11.1 Privacy Questions</h3>
                    <p>For questions about this Privacy Policy or our data practices:</p>
                    <ul className="ml-6 mt-2 space-y-1">
                      <li>• <strong>Email</strong>: support@GuitarTube.com</li>
                      <li>• <strong>Support</strong>: support@GuitarTube.com</li>
                      <li>• <strong>Data Protection Officer</strong>: support@GuitarTube.com</li>
                      <li>• <strong>Parents and Guardians</strong>: support@GuitarTube.com</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-yellow-200 mb-2">11.2 Exercise Your Rights</h3>
                    <p>To exercise your privacy rights or request data access/deletion:</p>
                    <ul className="ml-6 mt-2 space-y-1">
                      <li>• <strong>Email</strong>: support@GuitarTube.com</li>
                      <li>• <strong>Subject Line</strong>: "Privacy Rights Request"</li>
                      <li>• <strong>Include</strong>: Your registered email address and specific request details</li>
                      <li>• <strong>For Children's Accounts</strong>: Parents/guardians must include proof of relationship</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-semibold text-yellow-200 mb-2">11.3 Business Address</h3>
                    <p>GuitarTube</p>
                    <p>332 Richardson Dr, Mill Valley, CA, 94941</p>
                    
                    <div className="bg-blue-400/20 p-3 rounded-lg border border-blue-400/30 mt-3">
                      <p className="text-blue-300">
                        <strong>For Parent/Guardian Inquiries:</strong><br/>
                        Attention: Child Privacy Officer<br/>
                        Same address as above
                      </p>
                    </div>
                  </div>
                </div>
              </section>
              
              <div className="mt-8 p-4 bg-yellow-400/20 rounded-lg border border-yellow-400/30">
                <p className="text-yellow-300 text-center font-semibold">
                  <strong>This Privacy Policy is effective as of January 1, 2025. By using our Service, you acknowledge that you have read and understood this Privacy Policy and agree to our data practices as described herein.</strong>
                </p>
                <p className="text-center text-yellow-300 mt-2">
                  Last Updated: January 1, 2025 • GuitarTube Privacy Policy v2.0
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Component */}
      <Footer ref={footerRef} />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Menu Modal */}
      <MenuModal
        isOpen={showMenuModal}
        onClose={() => setShowMenuModal(false)}
        onSupportClick={() => footerRef.current?.openSupportModal()}
      />
      

      

    </div>
  )
}
