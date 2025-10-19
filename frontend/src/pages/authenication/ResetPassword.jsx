import { useState } from "react";
import { useResetPassword } from "../../hook/useAuth";

export default function ResetPassword() {
  const { mutate: resetPassword, isLoading } = useResetPassword();
  const [emailOrUsername, setEmailOrUsername] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    resetPassword({ credential: emailOrUsername });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md"
      >
        <h1 className="text-2xl font-semibold text-center text-indigo-700 mb-6">
          Reset Password
        </h1>

        <input
          type="text"
          placeholder="Email or Username"
          className="w-full border p-3 rounded-lg mb-5"
          value={emailOrUsername}
          onChange={(e) => setEmailOrUsername(e.target.value)}
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-semibold transition"
        >
          {isLoading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>
    </div>
  );
}
