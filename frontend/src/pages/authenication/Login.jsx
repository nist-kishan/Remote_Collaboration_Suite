import { useState } from "react";
import { motion } from "framer-motion";
import { useSignIn } from "../../hook/useAuth";
import { AuthContainer, AuthInput, AuthButton, AuthLink, AuthAlert } from "../../components/auth";
import { User, Lock, ArrowRight } from "lucide-react";

export default function Login() {
  const { mutate: signin, isLoading } = useSignIn();
  const [data, setData] = useState({ credential: "", password: "" });
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    
    if (!data.credential.trim()) {
      errors.credential = "Email or username is required";
    }
    
    if (!data.password) {
      errors.password = "Password is required";
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    signin(data);
  };

  return (
    <AuthContainer
      title="Welcome Back"
      subtitle="Sign in to your account to continue"
    >
      {/* Error Alert */}
      {formError && (
        <AuthAlert
          type="error"
          message={formError}
          onClose={() => setFormError("")}
        />
      )}

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Email/Username Input */}
        <AuthInput
          label="Email or Username"
          type="text"
          placeholder="Enter your email or username"
          value={data.credential}
          onChange={(e) => setData({ ...data, credential: e.target.value })}
          error={fieldErrors.credential}
          required
          icon={User}
          disabled={isLoading}
        />

        {/* Password Input */}
        <AuthInput
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={data.password}
          onChange={(e) => setData({ ...data, password: e.target.value })}
          error={fieldErrors.password}
          required
          icon={Lock}
          showPasswordToggle
          disabled={isLoading}
        />

        {/* Submit Button */}
        <AuthButton
          type="submit"
          loading={isLoading}
          disabled={isLoading}
          icon={ArrowRight}
          className="w-full"
        >
          {isLoading ? "Signing In..." : "Sign In"}
        </AuthButton>
      </motion.form>

      {/* Footer Links */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.5 }}
        className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
      >
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <AuthLink to="/signup" variant="muted">
            Don't have an account? Sign up
          </AuthLink>
          
          <AuthLink to="/reset-password" variant="default">
            Forgot your password?
          </AuthLink>
        </div>
      </motion.div>
    </AuthContainer>
  );
}
