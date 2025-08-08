class SessionManager {
  constructor() {
    this.sessionTimeout = parseInt(process.env.REACT_APP_SESSION_TIMEOUT) || 3600000; // 1 hour default
    this.warningTime = 5 * 60 * 1000; // 5 minutes before timeout
    this.timeoutId = null;
    this.warningTimeoutId = null;
    this.onSessionExpired = null;
    this.onSessionWarning = null;
    this.lastActivity = Date.now();
  }

  // Initialize session management
  init(onSessionExpired, onSessionWarning) {
    this.onSessionExpired = onSessionExpired;
    this.onSessionWarning = onSessionWarning;
    this.setupActivityListeners();
    this.resetTimer();
  }

  // Setup activity listeners
  setupActivityListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, this.handleActivity.bind(this), true);
    });
  }

  // Handle user activity
  handleActivity() {
    this.lastActivity = Date.now();
    this.resetTimer();
  }

  // Reset the session timer
  resetTimer() {
    // Clear existing timers
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    if (this.warningTimeoutId) {
      clearTimeout(this.warningTimeoutId);
    }

    // Only set timers if user is authenticated and didn't choose remember me
    const token = localStorage.getItem('token');
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    
    if (token && !rememberMe) {
      // Set warning timer
      this.warningTimeoutId = setTimeout(() => {
        if (this.onSessionWarning) {
          this.onSessionWarning();
        }
      }, this.sessionTimeout - this.warningTime);

      // Set session expiry timer
      this.timeoutId = setTimeout(() => {
        this.expireSession();
      }, this.sessionTimeout);
    }
  }

  // Expire the session
  expireSession() {
    if (this.onSessionExpired) {
      this.onSessionExpired();
    }
    this.cleanup();
  }

  // Extend session
  extendSession() {
    this.resetTimer();
  }

  // Cleanup timers and listeners
  cleanup() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    if (this.warningTimeoutId) {
      clearTimeout(this.warningTimeoutId);
      this.warningTimeoutId = null;
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.removeEventListener(event, this.handleActivity.bind(this), true);
    });
  }

  // Get remaining session time
  getRemainingTime() {
    const elapsed = Date.now() - this.lastActivity;
    return Math.max(0, this.sessionTimeout - elapsed);
  }

  // Check if session is about to expire
  isSessionExpiring() {
    return this.getRemainingTime() <= this.warningTime;
  }

  // Destroy session manager
  destroy() {
    this.cleanup();
    this.onSessionExpired = null;
    this.onSessionWarning = null;
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

export default sessionManager;

// Utility functions
export const formatTime = (milliseconds) => {
  const minutes = Math.floor(milliseconds / 60000);
  const seconds = Math.floor((milliseconds % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const isSessionActive = () => {
  const token = localStorage.getItem('token');
  const rememberMe = localStorage.getItem('rememberMe') === 'true';
  return !!(token && (rememberMe || sessionManager.getRemainingTime() > 0));
};
