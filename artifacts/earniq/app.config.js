module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    revenueCatIosApiKey:
      process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY ||
      "appl_WoycQNRYhGaBZJuLbCNEtnsIPOA",
  },
});
