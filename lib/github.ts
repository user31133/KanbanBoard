import { Octokit } from "@octokit/rest";

export const getOctokit = (token: string) => {
  return new Octokit({
    auth: token,
  });
};

export const validateToken = async (token: string) => {
  if (!token) return false;
  try {
    const octokit = getOctokit(token);
    const { data: user } = await octokit.rest.users.getAuthenticated();
    return user;
  } catch (error) {
    console.error("Token validation failed:", error);
    return null;
  }
};
