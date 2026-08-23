const fs = require('fs');
const path = require('path');

module.exports = ({ config }) => {
  let googleServicesPath = './google-services.json';

  if (process.env.GOOGLE_SERVICES_JSON) {
    try {
      if (fs.existsSync(process.env.GOOGLE_SERVICES_JSON)) {
        googleServicesPath = process.env.GOOGLE_SERVICES_JSON;
      } else {
        // Raw JSON string passed via Expo dashboard
        const targetPath = path.resolve(__dirname, 'google-services.json');
        fs.writeFileSync(targetPath, process.env.GOOGLE_SERVICES_JSON, 'utf8');
        googleServicesPath = './google-services.json';
      }
    } catch {
      googleServicesPath = './google-services.json';
    }
  }

  return {
    ...config,
    android: {
      ...config.android,
      googleServicesFile: googleServicesPath,
    },
  };
};
