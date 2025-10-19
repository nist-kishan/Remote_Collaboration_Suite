export const isValidPhone = (phone) => {
  const phoneRegex = /^\d{9,12}$/;
  return phoneRegex.test(phone);
};

export const isAllowedEmail = (email) => {
  if (!email) return false;

  const allowedDomains = [
    "gmail.com",
    "outlook.com",
    "kishan.com",
    "github.com",
    "icloud.com",
    "me.com",
    "mac.com",
  ];

  const emailParts = email.trim().split("@");
  if (emailParts.length !== 2 || !emailParts[0]) return false;

  const domain = emailParts[1].toLowerCase();
  return allowedDomains.includes(domain);
};
