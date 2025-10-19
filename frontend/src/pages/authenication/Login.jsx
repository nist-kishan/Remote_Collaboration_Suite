import { useState } from "react";
import { useSignIn } from "../../hook/useAuth";
import AuthForm from "../../components/auth/AuthForm";
import Input from "../../components/ui/Input";
import AuthLink from "../../components/auth/AuthLink";

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
      <AuthLink to="/signup">
        Create Account
      </AuthLink>
      <AuthLink to="/reset-password">
        Forgot Password?
      </AuthLink>
    </div>
  );

  return (
    <AuthForm
      title="Sign In"
      onSubmit={handleSubmit}
      submitText={isLoading ? "Signing in..." : "Sign In"}
      loading={isLoading}
      error={formError}
      footer={footer}
    >
      <Input
        type="text"
        placeholder="Email or Username"
        value={data.credential}
        onChange={(e) => setData({ ...data, credential: e.target.value })}
        disabled={isLoading}
      />

      <Input
        type="password"
        placeholder="Password"
        value={data.password}
        onChange={(e) => setData({ ...data, password: e.target.value })}
        disabled={isLoading}
      />
    </AuthForm>
  );
}
