import { useState } from "react";
import { useSignIn } from "../../hook/useAuth";
import LoginSignupForm from "../../components/auth/LoginSignupForm";
import CustomInput from "../../components/ui/CustomInput";
import AuthNavigationLink from "../../components/auth/AuthNavigationLink";

export default function Login() {
  const { mutate: signin, isLoading } = useSignIn();
  const [data, setData] = useState({ credential: "", password: "" });
  const [formError, setFormError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    if (!data.credential || !data.password) {
      setFormError("Please fill in both fields.");
      return;
    }

    signin(data);
  };

  const footer = (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-2 text-xs sm:text-sm">
      <AuthNavigationLink to="/signup">
        Create Account
      </AuthNavigationLink>
      <AuthNavigationLink to="/reset-password">
        Forgot Password?
      </AuthNavigationLink>
    </div>
  );

  return (
    <LoginSignupForm
      title="Sign In"
      onSubmit={handleSubmit}
      submitText={isLoading ? "Signing in..." : "Sign In"}
      loading={isLoading}
      error={formError}
      footer={footer}
    >
      <CustomInput
        type="text"
        placeholder="Email or Username"
        value={data.credential}
        onChange={(e) => setData({ ...data, credential: e.target.value })}
        disabled={isLoading}
      />

      <CustomInput
        type="password"
        placeholder="Password"
        value={data.password}
        onChange={(e) => setData({ ...data, password: e.target.value })}
        disabled={isLoading}
      />
      </LoginSignupForm>
  );
}
