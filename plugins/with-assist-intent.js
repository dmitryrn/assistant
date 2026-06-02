const { AndroidConfig, withAndroidManifest } = require("expo/config-plugins");

const assistAction = "android.intent.action.ASSIST";
const defaultCategory = "android.intent.category.DEFAULT";

function hasAssistIntentFilter(intentFilters) {
  if (!Array.isArray(intentFilters)) {
    return false;
  }

  return intentFilters.some((intentFilter) => {
    const actions = intentFilter.action;
    const categories = intentFilter.category;

    const hasAssistAction = Array.isArray(actions) && actions.some((action) => {
      return action.$?.["android:name"] === assistAction;
    });

    const hasDefaultCategory = Array.isArray(categories) && categories.some((category) => {
      return category.$?.["android:name"] === defaultCategory;
    });

    return hasAssistAction && hasDefaultCategory;
  });
}

function withAssistIntent(config) {
  return withAndroidManifest(config, (config) => {
    const mainActivity = AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults);

    if (!hasAssistIntentFilter(mainActivity["intent-filter"])) {
      mainActivity["intent-filter"] = mainActivity["intent-filter"] || [];
      mainActivity["intent-filter"].push({
        action: [
          {
            $: {
              "android:name": assistAction,
            },
          },
        ],
        category: [
          {
            $: {
              "android:name": defaultCategory,
            },
          },
        ],
      });
    }

    return config;
  });
}

module.exports = withAssistIntent;
