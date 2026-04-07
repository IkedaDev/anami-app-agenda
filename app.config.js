import { execSync } from "child_process";

const commitCount = parseInt(
  execSync("git rev-list --count HEAD").toString().trim(),
  10,
);

const commitHash = execSync("git rev-parse --short HEAD").toString().trim();

export default ({ config }) => {
  return {
    ...config,
    version: "1.0.1",
    android: {
      ...config.android,
      versionCode: commitCount,
    },
    extra: {
      ...config.extra,
      commitHash: commitHash,
      buildNumber: commitCount,
    },
  };
};
