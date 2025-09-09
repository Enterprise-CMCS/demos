import { randomBytes } from "crypto";

export function generateTempPassword(length: number = 20) {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXVZ"; // pragma: allowlist secret
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const number = "1234567890";
  const special = "!@#$%^&*";

  const allChars = upper + lower + number + special;

  let password = "";

  password += upper[randomBytes(1)[0] % upper.length];
  password += lower[randomBytes(1)[0] % lower.length];
  password += number[randomBytes(1)[0] % number.length];
  password += special[randomBytes(1)[0] % special.length];

  const remainLength = length - password.length;
  const bytes = randomBytes(remainLength);
  for (let i = 0; i < remainLength; i++) {
    password += allChars[bytes[i] % allChars.length];
  }

  const split = password.split("");
  for (let i = split.length - 1; i > 0; i--) {
    const rb = randomBytes(1)[0];
    const j = rb % (i + 1);
    [split[i], split[j]] = [split[j], split[i]];
  }

  return split.join("");
}
