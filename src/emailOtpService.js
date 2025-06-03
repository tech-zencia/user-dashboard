// Email OTP Service
// This simulates sending and verifying OTP for email verification
// In a real application, you would use a backend API for this

// Generate a random OTP
export const generateOTP = () => {
    // Generate a 6-digit OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
  };
  
  // Store OTPs in session storage
  // Note: In a real application, this should be handled by the backend
  const storeOTP = (email, otp) => {
    const otpData = {
      otp,
      email,
      timestamp: Date.now(),
      attempts: 0
    };
    sessionStorage.setItem(`otp_${email}`, JSON.stringify(otpData));
  };
  
  // Get stored OTP data
  const getStoredOTP = (email) => {
    const otpData = sessionStorage.getItem(`otp_${email}`);
    if (!otpData) return null;
    return JSON.parse(otpData);
  };
  
  // Remove OTP data
  const removeOTP = (email) => {
    sessionStorage.removeItem(`otp_${email}`);
  };
  
  // Send OTP to email (simulation)
  export const sendOTPToEmail = (email) => {
    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP
    storeOTP(email, otp);
    
    // In a real application, you would call your backend API to send the email
    console.log(`OTP sent to ${email}: ${otp}`);
    
    // For demo purposes, we're showing the OTP in an alert
    // REMOVE THIS IN PRODUCTION - this is just for testing
    setTimeout(() => {
      alert(`Your OTP (for demo only): ${otp}\nIn a real app, this would be sent to your email: ${email}`);
    }, 1000);
    
    return true;
  };
  
  // Verify OTP
  export const verifyOTP = (email, userEnteredOTP) => {
    const otpData = getStoredOTP(email);
    
    // If no OTP found
    if (!otpData) {
      return { 
        success: false, 
        message: 'OTP expired or not found. Please request a new OTP.' 
      };
    }
    
    // Check if OTP is expired (15 minutes)
    const expiryTime = 15 * 60 * 1000; // 15 minutes in milliseconds
    if (Date.now() - otpData.timestamp > expiryTime) {
      removeOTP(email);
      return { 
        success: false, 
        message: 'OTP has expired. Please request a new OTP.' 
      };
    }
    
    // Increment attempts
    otpData.attempts += 1;
    sessionStorage.setItem(`otp_${email}`, JSON.stringify(otpData));
    
    // Check if too many attempts (max 3)
    if (otpData.attempts > 3) {
      removeOTP(email);
      return { 
        success: false, 
        message: 'Too many failed attempts. Please request a new OTP.' 
      };
    }
    
    // Check if OTP matches
    if (otpData.otp === userEnteredOTP) {
      // OTP verified successfully
      removeOTP(email);
      return { 
        success: true, 
        message: 'Email verified successfully!' 
      };
    }
    
    // OTP doesn't match
    return { 
      success: false, 
      message: 'Invalid OTP. Please try again.' 
    };
  };