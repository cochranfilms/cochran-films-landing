// User Preferences Management with Airtable Integration
// Handles opt-in/opt-out functionality for SMS compliance

class UserPreferencesManager {
  constructor() {
    // Your Airtable base ID for user preferences
    this.airtableBaseId = 'appXjhRWId71m6xGe';
    this.airtableTableName = 'User Preferences'; // Adjust if different
    this.apiBase = (typeof window !== 'undefined' && window.API_BASE_URL)
      ? window.API_BASE_URL
      : window.location.origin;
    
    this.init();
  }
  
  init() {
    console.log('🚀 Initializing User Preferences Manager...');
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Listen for form submissions to capture preferences
    document.addEventListener('submit', (e) => {
      if (e.target.id === 'bookingForm' || e.target.id === 'toolkitForm') {
        this.handleFormSubmission(e);
      }
    });
  }
  
  async handleFormSubmission(event) {
    const form = event.target;
    const formData = new FormData(form);
    
    // Extract preference data
    const preferences = {
      email: formData.get('email') || document.getElementById('email')?.value,
      name: formData.get('name') || document.getElementById('name')?.value,
      phone: formData.get('phone') || document.getElementById('phone')?.value,
      opt_email: document.getElementById('opt_email')?.checked || false,
      opt_calls: document.getElementById('opt_calls')?.checked || false,
      opt_texts: document.getElementById('opt_texts')?.checked || false,
      sms_consent: document.getElementById('sms_consent_yes')?.checked ? 'yes' : 'no',
      source_form: form.id,
      submitted_at: new Date().toISOString(),
      status: 'active'
    };
    
    if (preferences.email) {
      try {
        // Save to Airtable
        await this.savePreferencesToAirtable(preferences);
        
        // Also save locally as backup
        this.savePreferencesLocally(preferences);
        
        console.log('✅ Preferences saved successfully:', preferences);
      } catch (error) {
        console.error('❌ Failed to save preferences:', error);
        // Fallback to local storage only
        this.savePreferencesLocally(preferences);
      }
    }
  }
  
  async savePreferencesToAirtable(preferences) {
    const endpoint = `${this.apiBase}/api/user-preferences`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        baseId: this.airtableBaseId,
        tableName: this.airtableTableName,
        preferences: preferences
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }
  
  savePreferencesLocally(preferences) {
    try {
      const key = `preferences_${preferences.email}`;
      localStorage.setItem(key, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save preferences locally:', error);
    }
  }
  
  async checkPreferences(email) {
    try {
      // Try Airtable first
      const airtablePrefs = await this.getPreferencesFromAirtable(email);
      if (airtablePrefs) {
        return airtablePrefs;
      }
    } catch (error) {
      console.warn('Failed to get preferences from Airtable, using local:', error);
    }
    
    // Fallback to local storage
    return this.getPreferencesLocally(email);
  }
  
  async getPreferencesFromAirtable(email) {
    const endpoint = `${this.apiBase}/api/user-preferences?email=${encodeURIComponent(email)}&baseId=${this.airtableBaseId}&tableName=${this.airtableTableName}`;
    
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.preferences || null;
  }
  
  getPreferencesLocally(email) {
    try {
      const key = `preferences_${email}`;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get local preferences:', error);
      return null;
    }
  }
  
  async updatePreferences(email, updates) {
    try {
      // Update in Airtable
      const endpoint = `${this.apiBase}/api/user-preferences`;
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          baseId: this.airtableBaseId,
          tableName: this.airtableTableName,
          email: email,
          updates: updates
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Update local storage
      const localPrefs = this.getPreferencesLocally(email) || {};
      const updatedPrefs = { ...localPrefs, ...updates, updatedAt: new Date().toISOString() };
      this.savePreferencesLocally(updatedPrefs);
      
      return await response.json();
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    }
  }
  
  async unsubscribe(email) {
    return await this.updatePreferences(email, {
      status: 'unsubscribed',
      unsubscribed_at: new Date().toISOString()
    });
  }
  
  async resubscribe(email) {
    return await this.updatePreferences(email, {
      status: 'active',
      resubscribed_at: new Date().toISOString()
    });
  }
  
  // Check if user should receive specific type of communication
  async shouldReceiveCommunication(email, type) {
    const prefs = await this.checkPreferences(email);
    
    if (!prefs || prefs.status !== 'active') {
      return false;
    }
    
    switch (type) {
      case 'email':
        return prefs.opt_email === true;
      case 'calls':
        return prefs.opt_calls === true;
      case 'texts':
        return prefs.opt_texts === true && prefs.sms_consent === 'yes';
      default:
        return false;
    }
  }
  
  // Get all active subscribers for a specific communication type
  async getActiveSubscribers(type) {
    try {
      const endpoint = `${this.apiBase}/api/user-preferences/subscribers?baseId=${this.airtableBaseId}&tableName=${this.airtableTableName}&type=${type}`;
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Failed to get active subscribers:', error);
      return [];
    }
  }
}

// Initialize the preferences manager
let preferencesManager;

if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    preferencesManager = new UserPreferencesManager();
  });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UserPreferencesManager;
}
