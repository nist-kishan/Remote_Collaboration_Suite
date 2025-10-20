import { useState, useEffect } from "react";
import { useSignUp } from "../../hook/useAuth";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import LoadingSpinner from "../../components/ui/LoadingSpinner";
import LoginSignupForm from "../../components/auth/LoginSignupForm";
import CustomInput from "../../components/ui/CustomInput";
import AuthNavigationLink from "../../components/auth/AuthNavigationLink";
import PhoneVerificationCode from "../../components/Authentication/PhoneVerificationCode";

export default function Signup() {
  const navigate = useNavigate();
  const { mutate: signup, isLoading } = useSignUp();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    countrycode: "+91",
    phone: "",
  });

  const [countryCodes, setCountryCodes] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchCountryCodes = async () => {
      try {
        const response = await axios.get(
          "https://restcountries.com/v3.1/all?fields=name,idd"
        );

        if (isMounted) {
          const codes = response.data
            .map((c) => ({
              name: c.name.common,
              dial_code: c.idd?.root
                ? c.idd.root + (c.idd.suffixes ? c.idd.suffixes[0] : "")
                : null,
            }))
            .filter((c) => c.dial_code)
            .sort((a, b) => a.name.localeCompare(b.name));

          // Remove duplicates to avoid "same key" warnings
          const uniqueCodes = Array.from(
            new Map(codes.map((c) => [c.dial_code, c])).values()
          );

          setCountryCodes(uniqueCodes);
        }
      } finally {
        isMounted && setLoadingCodes(false);
      }
    };

    fetchCountryCodes();
    return () => (isMounted = false);
  }, []);

  const handleChange = (key, value) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    signup(formData); // Hook handles success/error & navigation
  };

  if (loadingCodes) {
    return <LoadingSpinner />;
  }

  const footer = (
    <p>
      Already have an account?{" "}
      <AuthNavigationLink to="/login">
        Sign In
      </AuthNavigationLink>
    </p>
  );

  return (
    <LoginSignupForm
      title="Sign Up"
      onSubmit={handleSubmit}
      submitText={isLoading ? "Creating Account..." : "Sign Up"}
      loading={isLoading}
      footer={footer}
    >
      {["name", "email", "username", "password"].map((key) => (
        <CustomInput
          key={key}
          type={key === "password" ? "password" : "text"}
          placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
          value={formData[key]}
          onChange={(e) => handleChange(key, e.target.value)}
          disabled={isLoading}
        />
      ))}

      <PhoneVerificationCode
        countrycode={formData.countrycode}
        handleChange={handleChange}
        countryCodes={countryCodes}
      />

      <CustomInput
        type="number"
        placeholder="Phone Number"
        value={formData.phone}
        onChange={(e) => handleChange("phone", e.target.value)}
        disabled={isLoading}
      />
      </LoginSignupForm>
  );
}
