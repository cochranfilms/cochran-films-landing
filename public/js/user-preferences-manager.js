// User Preferences Manager for Cochran Films
// Handles form submissions and connects to User Preferences CMS Collection

class UserPreferencesManager {
  constructor() {
    this.apiBase = window.location.origin;
    this.init();
  }

  init() {
    console.log('🚀 Initializing User Preferences Manager...');
    
    // Initialize form handlers
    this.initializeFormHandlers();
    
    // Initialize preference retrieval
    this.initializePreferenceRetrieval();
    
    console.log('✅ User Preferences Manager initialized successfully');
  }

  initializeFormHandlers() {
    // Handle all contact forms on the page
    this.handleContactForms();
    
    // Handle service inquiry forms
    this.handleServiceForms();
    
    // Handle booking forms
    this.handleBookingForms();
    
    // Handle newsletter signup forms
    this.handleNewsletterForms();
  }

  handleContactForms() {
    // Find all contact forms
    const contactForms = document.querySelectorAll('form[data-form-type="contact"], .contact-form, #contact form, form');
    
    contactForms.forEach(form => {
      // Skip forms that already have handlers
      if (form.dataset.hasFormHandler) return;
      
      form.dataset.hasFormHandler = 'true';
      
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmission(form, 'contact');
      });
    });

    console.log(`📝 Added handlers to ${contactForms.length} contact forms`);
    
    // Debug: log form details
    contactForms.forEach((form, index) => {
      console.log(`Form ${index + 1}:`, {
        id: form.id,
        className: form.className,
        action: form.action,
        method: form.method,
        elements: form.elements ? form.elements.length : 'No elements property'
      });
    });
  }

  handleServiceForms() {
    // Find all service inquiry forms
    const serviceForms = document.querySelectorAll('form[data-form-type="service"], .service-form, [data-service-form]');
    
    serviceForms.forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmission(form, 'service');
      });
    });

    console.log(`🔧 Added handlers to ${serviceForms.length} service forms`);
  }

  handleBookingForms() {
    // Find all booking forms
    const bookingForms = document.querySelectorAll('form[data-form-type="booking"], .booking-form, [data-booking-form]');
    
    bookingForms.forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmission(form, 'booking');
      });
    });

    console.log(`📅 Added handlers to ${bookingForms.length} booking forms`);
  }

  handleNewsletterForms() {
    // Find all newsletter signup forms
    const newsletterForms = document.querySelectorAll('form[data-form-type="newsletter"], .newsletter-form, [data-newsletter-form]');
    
    newsletterForms.forEach(form => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmission(form, 'newsletter');
      });
    });

    console.log(`📧 Added handlers to ${newsletterForms.length} newsletter forms`);
  }

  async handleFormSubmission(form, formType) {
    try {
      console.log(`🚀 Processing form submission: ${formType}`, {
        formId: form.id,
        formClass: form.className,
        formAction: form.action
      });
      
      // Show loading state
      this.showFormLoading(form);
      
      // Extract form data
      const formData = this.extractFormData(form, formType);
      
      console.log(`📊 Extracted form data:`, formData);
      
      // Validate form data
      if (!this.validateFormData(formData)) {
        console.warn('❌ Form validation failed');
        this.showFormError(form, 'Please fill in all required fields.');
        return;
      }
      
      console.log(`✅ Form validation passed, submitting to API...`);
      
      // Submit to User Preferences API
      const response = await this.submitToUserPreferences(formData);
      
      if (response.success) {
        console.log(`✅ Form submitted successfully:`, response);
        
        // Show success message
        this.showFormSuccess(form, 'Thank you! Your information has been submitted successfully.');
        
        // Clear form
        this.clearForm(form);
        
        // Track submission
        this.trackFormSubmission(formType, formData);
        
        // Trigger any additional actions (EmailJS, etc.)
        this.triggerAdditionalActions(formType, formData);
        
      } else {
        throw new Error(response.message || 'Failed to submit form');
      }
      
    } catch (error) {
      console.error('❌ Form submission error:', error);
      this.showFormError(form, 'Sorry, there was an error submitting your form. Please try again.');
    } finally {
      // Hide loading state
      this.hideFormLoading(form);
    }
  }

  extractFormData(form, formType) {
    const formData = {
      formType: formType,
      source: window.location.pathname,
      submissionDate: new Date().toISOString()
    };

    // Extract form fields - handle both HTMLFormElement and other form-like elements
    let formElements = form.elements;
    
    // Fallback to querySelector if elements property doesn't exist
    if (!formElements || !formElements.length) {
      formElements = form.querySelectorAll('input, select, textarea');
    }
    
    // Convert to array if it's not iterable
    const elementsArray = Array.from(formElements || []);
    
    console.log(`🔍 Extracting data from form: ${form.id || form.className}`, {
      formType: formType,
      elementsFound: elementsArray.length,
      hasElementsProperty: !!form.elements
    });
    
    for (let element of elementsArray) {
      if (element.name && element.value) {
        const fieldName = element.name.toLowerCase();
        const fieldValue = element.value.trim();
        
        // Map common field names to our schema
        switch (fieldName) {
          case 'name':
          case 'fullname':
          case 'firstname':
          case 'first_name':
            formData.name = fieldValue;
            break;
            
          case 'email':
          case 'emailaddress':
            formData.email = fieldValue;
            break;
            
          case 'phone':
          case 'phonenumber':
          case 'telephone':
            formData.phone = fieldValue;
            break;
            
          case 'company':
          case 'companyname':
          case 'organization':
            formData.company = fieldValue;
            break;
            
          case 'message':
          case 'comments':
          case 'description':
            formData.projectDetails = fieldValue;
            break;
            
          case 'service':
          case 'serviceinterest':
          case 'typeofservice':
            formData.serviceInterest = fieldValue;
            break;
            
          case 'budget':
          case 'budgetrange':
          case 'budget_amount':
            formData.budgetRange = fieldValue;
            break;
            
          case 'timeline':
          case 'deadline':
          case 'project_timeline':
            formData.timeline = fieldValue;
            break;
            
          case 'marketing':
          case 'newsletter':
          case 'marketing_consent':
            formData.marketingConsent = element.checked || fieldValue === 'yes';
            break;
            
          case 'contact_method':
          case 'preferred_contact':
            formData.preferredContact = fieldValue;
            break;
            
          default:
            // Store any other fields in notes
            if (!formData.notes) formData.notes = '';
            formData.notes += `${element.name}: ${fieldValue}\n`;
        }
      }
    }

    // Extract data attributes
    const dataAttributes = form.dataset;
    if (dataAttributes.serviceInterest) {
      formData.serviceInterest = dataAttributes.serviceInterest;
    }
    if (dataAttributes.budgetRange) {
      formData.budgetRange = dataAttributes.budgetRange;
    }
    if (dataAttributes.timeline) {
      formData.timeline = dataAttributes.timeline;
    }

    return formData;
  }

  validateFormData(formData) {
    // Check required fields
    if (!formData.email || !formData.name) {
      return false;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return false;
    }
    
    return true;
  }

  async submitToUserPreferences(formData) {
    const response = await fetch(`${this.apiBase}/api/user-preferences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  showFormLoading(form) {
    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    }
  }

  hideFormLoading(form) {
    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = submitBtn.dataset.originalText || 'Submit';
    }
  }

  showFormSuccess(form, message) {
    // Remove existing messages
    this.removeFormMessages(form);
    
    // Create success message
    const successDiv = document.createElement('div');
    successDiv.className = 'form-success-message';
    successDiv.innerHTML = `
      <div class="success-content">
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
      </div>
    `;
    
    // Insert after form
    form.parentNode.insertBefore(successDiv, form.nextSibling);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (successDiv.parentNode) {
        successDiv.remove();
      }
    }, 5000);
  }

  showFormError(form, message) {
    // Remove existing messages
    this.removeFormMessages(form);
    
    // Create error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error-message';
    errorDiv.innerHTML = `
      <div class="error-content">
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
      </div>
    `;
    
    // Insert after form
    form.parentNode.insertBefore(errorDiv, form.nextSibling);
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 8000);
  }

  removeFormMessages(form) {
    const existingMessages = form.parentNode.querySelectorAll('.form-success-message, .form-error-message');
    existingMessages.forEach(msg => msg.remove());
  }

  clearForm(form) {
    form.reset();
    
    // Clear any custom form elements
    const customInputs = form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea');
    customInputs.forEach(input => {
      input.value = '';
    });
    
    // Uncheck checkboxes and radio buttons
    const checkboxes = form.querySelectorAll('input[type="checkbox"], input[type="radio"]');
    checkboxes.forEach(input => {
      input.checked = false;
    });
  }

  trackFormSubmission(formType, formData) {
    // Track in analytics if available
    if (typeof gtag !== 'undefined') {
      gtag('event', 'form_submit', {
        'event_category': 'engagement',
        'event_label': formType,
        'value': 1
      });
    }
    
    // Track in console for debugging
    console.log(`📊 Form submitted: ${formType}`, {
      email: formData.email,
      service: formData.serviceInterest,
      timestamp: new Date().toISOString()
    });
  }

  triggerAdditionalActions(formType, formData) {
    // Trigger EmailJS if available
    if (typeof emailjs !== 'undefined') {
      this.triggerEmailJS(formType, formData);
    }
    
    // Trigger any other integrations
    this.triggerIntegrations(formType, formData);
  }

  triggerEmailJS(formType, formData) {
    try {
      // Map form types to EmailJS templates
      const templateMap = {
        'contact': 'contact_form',
        'service': 'service_inquiry',
        'booking': 'booking_request',
        'newsletter': 'newsletter_signup'
      };
      
      const templateId = templateMap[formType];
      if (templateId) {
        emailjs.send('template-contact-client', templateId, {
          to_name: formData.name,
          to_email: formData.email,
          message: formData.projectDetails || 'No additional details provided',
          service_interest: formData.serviceInterest || 'General inquiry'
        });
      }
    } catch (error) {
      console.warn('EmailJS trigger failed:', error);
    }
  }

  triggerIntegrations(formType, formData) {
    // Add any other integration triggers here
    // For example: HubSpot, Salesforce, etc.
  }

  // ===== PREFERENCE RETRIEVAL =====
  
  initializePreferenceRetrieval() {
    // Check for existing user preferences on page load
    this.checkExistingPreferences();
  }

  async checkExistingPreferences() {
    // Check if user has existing preferences (e.g., from localStorage or cookies)
    const userEmail = this.getStoredUserEmail();
    
    if (userEmail) {
      try {
        const preferences = await this.getUserPreferences(userEmail);
        if (preferences) {
          this.applyUserPreferences(preferences);
        }
      } catch (error) {
        console.warn('Failed to retrieve user preferences:', error);
      }
    }
  }

  getStoredUserEmail() {
    // Check localStorage, cookies, or other storage methods
    return localStorage.getItem('userEmail') || 
           this.getCookie('userEmail') || 
           null;
  }

  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  async getUserPreferences(email) {
    try {
      const response = await fetch(`${this.apiBase}/api/user-preferences?email=${encodeURIComponent(email)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // No preferences found
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.preferences;
      
    } catch (error) {
      console.error('Failed to get user preferences:', error);
      return null;
    }
  }

  applyUserPreferences(preferences) {
    // Pre-fill forms with existing preferences
    this.prefillForms(preferences);
    
    // Apply any UI customizations based on preferences
    this.applyUICustomizations(preferences);
    
    // Store email for future use
    if (preferences.Email) {
      localStorage.setItem('userEmail', preferences.Email);
    }
  }

  prefillForms(preferences) {
    // Find all forms and pre-fill with existing data
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
      // Pre-fill name
      const nameInput = form.querySelector('input[name*="name" i]');
      if (nameInput && preferences.Name) {
        nameInput.value = preferences.Name;
      }
      
      // Pre-fill email
      const emailInput = form.querySelector('input[name*="email" i]');
      if (emailInput && preferences.Email) {
        emailInput.value = preferences.Email;
      }
      
      // Pre-fill phone
      const phoneInput = form.querySelector('input[name*="phone" i]');
      if (phoneInput && preferences.Phone) {
        phoneInput.value = preferences.Phone;
      }
      
      // Pre-fill company
      const companyInput = form.querySelector('input[name*="company" i]');
      if (companyInput && preferences.Company) {
        companyInput.value = preferences.Company;
      }
    });
  }

  applyUICustomizations(preferences) {
    // Apply any UI customizations based on user preferences
    // For example: preferred contact method, service interests, etc.
    
    if (preferences['Preferred Contact Method']) {
      // Highlight preferred contact method in forms
      const contactMethodInputs = document.querySelectorAll(`input[value*="${preferences['Preferred Contact Method']}" i]`);
      contactMethodInputs.forEach(input => {
        input.checked = true;
      });
    }
  }

  // ===== PUBLIC METHODS =====
  
  // Method to manually submit a form (for external use)
  async submitForm(formData) {
    try {
      const response = await this.submitToUserPreferences(formData);
      return response;
    } catch (error) {
      console.error('Manual form submission failed:', error);
      throw error;
    }
  }

  // Method to get user preferences (for external use)
  async getPreferences(email) {
    return await this.getUserPreferences(email);
  }

  // Method to clear stored preferences
  clearStoredPreferences() {
    localStorage.removeItem('userEmail');
    document.cookie = 'userEmail=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  }
}

// Initialize User Preferences Manager when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.userPreferencesManager = new UserPreferencesManager();
  });
} else {
  window.userPreferencesManager = new UserPreferencesManager();
}

// Add form styles
const formStyles = `
  <style>
    .form-success-message,
    .form-error-message {
      margin: 15px 0;
      padding: 15px;
      border-radius: 8px;
      font-weight: 500;
    }
    
    .form-success-message {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #10b981;
    }
    
    .form-error-message {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #ef4444;
    }
    
    .success-content,
    .error-content {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .success-content i,
    .error-content i {
      font-size: 18px;
    }
    
    .form-loading button[type="submit"],
    .form-loading input[type="submit"] {
      opacity: 0.7;
      cursor: not-allowed;
    }
  </style>
`;

document.head.insertAdjacentHTML('beforeend', formStyles);
