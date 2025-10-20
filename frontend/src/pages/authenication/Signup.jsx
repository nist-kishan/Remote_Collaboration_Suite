import { useState } from "react";
import { motion } from "framer-motion";
import { useSignUp } from "../../hook/useAuth";
import { AuthContainer, AuthInput, AuthButton, AuthLink, AuthAlert } from "../../components/auth";
import { User, Mail, Lock, Phone, Globe, ArrowRight } from "lucide-react";

export default function Signup() {
  const { mutate: signup, isLoading } = useSignUp();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    countrycode: "+91",
    phone: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = "Full name is required";
    }
    
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email";
    }
    
    if (!formData.username.trim()) {
      errors.username = "Username is required";
    } else if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    }
    
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    
    if (!formData.countrycode.trim()) {
      errors.countrycode = "Code is required";
    } else if (!/^\+[1-9]\d{0,3}$/.test(formData.countrycode)) {
      errors.countrycode = "Please enter a valid code (e.g., +91)";
    }
    
    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      errors.phone = "Phone number must be 10 digits";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Remove confirmPassword from the data sent to API
    const { confirmPassword, ...signupData } = formData;
    signup(signupData);
  };


  return (
    <AuthContainer
      title="Create Account"
      subtitle="Join our platform and start collaborating"
    >
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Name Input */}
        <AuthInput
          label="Full Name"
          type="text"
          placeholder="Enter your full name"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          error={fieldErrors.name}
          required
          icon={User}
          disabled={isLoading}
        />

        {/* Email Input */}
        <AuthInput
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(e) => handleChange("email", e.target.value)}
          error={fieldErrors.email}
          required
          icon={Mail}
          disabled={isLoading}
        />

        {/* Username Input */}
        <AuthInput
          label="Username"
          type="text"
          placeholder="Choose a username"
          value={formData.username}
          onChange={(e) => handleChange("username", e.target.value)}
          error={fieldErrors.username}
          required
          icon={User}
          disabled={isLoading}
        />

        {/* Password Input */}
        <AuthInput
          label="Password"
          type="password"
          placeholder="Create a password"
          value={formData.password}
          onChange={(e) => handleChange("password", e.target.value)}
          error={fieldErrors.password}
          required
          icon={Lock}
          showPasswordToggle
          disabled={isLoading}
        />

        {/* Confirm Password Input */}
        <AuthInput
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={(e) => handleChange("confirmPassword", e.target.value)}
          error={fieldErrors.confirmPassword}
          required
          icon={Lock}
          showPasswordToggle
          disabled={isLoading}
        />

        {/* Country Code and Phone */}
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-1">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="relative"
            >
              <AuthInput
                label="Code"
                type="tel"
                placeholder="+91"
                value={formData.countrycode}
                onChange={(e) => handleChange("countrycode", e.target.value)}
                error={fieldErrors.countrycode}
                required
                disabled={isLoading}
                icon={Globe}
              />
            </motion.div>
          </div>
          <div className="col-span-3">
            <AuthInput
              label="Phone Number"
              type="tel"
              placeholder="Enter your phone number"
        value={formData.phone}
        onChange={(e) => handleChange("phone", e.target.value)}
              error={fieldErrors.phone}
              required
              icon={Phone}
        disabled={isLoading}
      />
          </div>
        </div>

        {/* Submit Button */}
        <AuthButton
          type="submit"
          loading={isLoading}
          disabled={isLoading}
          icon={ArrowRight}
          className="w-full"
        >
          {isLoading ? "Creating Account..." : "Create Account"}
        </AuthButton>
      </motion.form>

      {/* Footer Links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
      >
        <div className="text-center">
          <AuthLink to="/login" variant="muted">
            Already have an account? Sign in
          </AuthLink>
        </div>
      </motion.div>
    </AuthContainer>
  );
}
