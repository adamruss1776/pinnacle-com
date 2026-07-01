module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    revenueCatIosApiKey:
      process.env.REVENUECAT_API_KEY ||
      process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ||
      "",
  },
});
