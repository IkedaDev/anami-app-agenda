// app.config.js
const { execSync } = require("child_process");

const getGitInfo = () => {
  try {
    // Obtenemos el número total de commits para el versionCode
    const count = execSync("git rev-list --count HEAD").toString().trim();
    // Obtenemos el hash corto del commit para mostrarlo en la app
    const hash = execSync("git rev-parse --short HEAD").toString().trim();

    return {
      count: parseInt(count, 10) || 1,
      hash,
    };
  } catch (e) {
    // Si falla (por ejemplo en el primer build sin commits), usamos valores por defecto
    return { count: 1, hash: "unknown" };
  }
};

const { count, hash } = getGitInfo();

module.exports = ({ config }) => {
  return {
    ...config,
    version: "1.0.3",
    android: {
      ...config.android,
      // Usamos 'count' que es la variable definida arriba
      versionCode: count,
    },
    extra: {
      ...config.extra,
      // Usamos 'hash' y 'count' que son las variables extraídas de getGitInfo
      commitHash: hash,
      buildNumber: count,
    },
  };
};
