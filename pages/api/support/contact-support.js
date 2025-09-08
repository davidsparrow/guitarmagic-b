// pages/api/support/contact-support.js - Support Contact Form API Endpoint
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client for admin notifications
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { name, email, subject, message } = req.body

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    // Prepare email content
    const emailContent = {
      Messages: [
        {
          From: {
            Email: process.env.MAILJET_FROM_EMAIL || 'noreply@guitartube.net',
            Name: 'GuitarTube Support'
          },
          To: [
            {
              Email: 'support@guitartube.net',
              Name: 'GuitarTube Support Team'
            }
          ],
          Subject: `Support Request: ${subject}`,
          TextPart: `
Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

---
Sent from GuitarTube Support Form
          `.trim(),
          HTMLPart: `
<h2>New Support Request</h2>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Subject:</strong> ${subject}</p>
<p><strong>Message:</strong></p>
<p>${message.replace(/\n/g, '<br>')}</p>
<hr>
<p><em>Sent from GuitarTube Support Form</em></p>
          `.trim()
        }
      ]
    }

    // Send email via Mailjet
    const mailjetResponse = await fetch('https://api.mailjet.com/v3.1/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(
          `${process.env.MAILJET_API_KEY}:${process.env.MAILJET_API_SECRET}`
        ).toString('base64')}`
      },
      body: JSON.stringify(emailContent)
    })

    if (!mailjetResponse.ok) {
      const errorData = await mailjetResponse.text()
      console.error('Mailjet API error:', errorData)
      
      // Log error and notify admin via backup system
      await logErrorAndNotifyAdmin({
        error: 'Mailjet API failed',
        details: errorData,
        supportRequest: { name, email, subject, message }
      })
      
      return res.status(500).json({ error: 'Failed to send email' })
    }

    // Success - email sent
    return res.status(200).json({ 
      success: true, 
      message: 'Support request sent successfully' 
    })

  } catch (error) {
    console.error('Contact support API error:', error)
    
    // Log error and notify admin via backup system
    await logErrorAndNotifyAdmin({
      error: 'Contact support API exception',
      details: error.message,
      supportRequest: req.body
    })
    
    return res.status(500).json({ error: 'Internal server error' })
  }
}

// Function to log errors and notify admin via backup system
async function logErrorAndNotifyAdmin(errorData) {
  try {
    // Store error in Supabase for admin review
    const { error } = await supabase
      .from('admin_error_logs')
      .insert([
        {
          error_type: 'support_form_failure',
          error_message: errorData.error,
          error_details: JSON.stringify(errorData.details),
          context_data: JSON.stringify(errorData.supportRequest),
          timestamp: new Date().toISOString()
        }
      ])

    if (error) {
      console.error('Failed to log error to Supabase:', error)
    }

    // TODO: Implement backup admin notification system
    // This could be a webhook to another service, SMS, or alternative email provider
    console.log('Error logged - admin notification needed:', errorData)
    
  } catch (logError) {
    console.error('Failed to log error:', logError)
  }
}
