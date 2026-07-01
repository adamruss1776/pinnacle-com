import { getUncachableRevenueCatClient } from "./revenueCatClient";

import {
  listProjects,
  createProject,
  listApps,
  createApp,
  listAppPublicApiKeys,
  listProducts,
  createProduct,
  listEntitlements,
  createEntitlement,
  attachProductsToEntitlement,
  listOfferings,
  createOffering,
  updateOffering,
  listPackages,
  createPackages,
  attachProductsToPackage,
  type App,
  type Product,
  type Project,
  type Entitlement,
  type Offering,
  type Package,
  type CreateProductData,
} from "@replit/revenuecat-sdk";

const PROJECT_NAME = "EarnIQ";

const MONTHLY_PRODUCT_IDENTIFIER = "earniq_pro_monthly";
const ANNUAL_PRODUCT_IDENTIFIER = "earniq_pro_annual";
const PLAY_STORE_MONTHLY_IDENTIFIER = "earniq_pro_monthly:monthly";
const PLAY_STORE_ANNUAL_IDENTIFIER = "earniq_pro_annual:annual";

const APP_STORE_APP_NAME = "EarnIQ iOS";
const APP_STORE_BUNDLE_ID = "com.earniq.app";
const PLAY_STORE_APP_NAME = "EarnIQ Android";
const PLAY_STORE_PACKAGE_NAME = "com.earniq.app";

const ENTITLEMENT_IDENTIFIER = "pro";
const ENTITLEMENT_DISPLAY_NAME = "Pro Access";

const OFFERING_IDENTIFIER = "default";
const OFFERING_DISPLAY_NAME = "Default Offering";

const MONTHLY_PACKAGE_IDENTIFIER = "$rc_monthly";
const MONTHLY_PACKAGE_DISPLAY_NAME = "Monthly Pro";

const ANNUAL_PACKAGE_IDENTIFIER = "$rc_annual";
const ANNUAL_PACKAGE_DISPLAY_NAME = "Annual Pro";

const MONTHLY_PRICES = [
  { amount_micros: 3990000, currency: "USD" },
];

const ANNUAL_PRICES = [
  { amount_micros: 29990000, currency: "USD" },
];

type TestStorePricesResponse = {
  object: string;
  prices: { amount_micros: number; currency: string }[];
};

async function setTestStorePrices(
  client: Awaited<ReturnType<typeof getUncachableRevenueCatClient>>,
  projectId: string,
  productId: string,
  prices: { amount_micros: number; currency: string }[],
  label: string
) {
  const { error } = await client.post<TestStorePricesResponse>({
    url: "/projects/{project_id}/products/{product_id}/test_store_prices",
    path: { project_id: projectId, product_id: productId },
    body: { prices },
  });

  if (error) {
    if (error && typeof error === "object" && "type" in error && error["type"] === "resource_already_exists") {
      console.log(`${label} test store prices already exist`);
    } else {
      throw new Error(`Failed to add ${label} test store prices`);
    }
  } else {
    console.log(`${label} test store prices added successfully`);
  }
}

async function seedRevenueCat() {
  const client = await getUncachableRevenueCatClient();

  // ── Project ──────────────────────────────────────────────────────────
  let project: Project;
  const { data: existingProjects, error: listProjectsError } = await listProjects({
    client,
    query: { limit: 20 },
  });
  if (listProjectsError) throw new Error("Failed to list projects");

  const existingProject = existingProjects.items?.find((p) => p.name === PROJECT_NAME);
  if (existingProject) {
    console.log("Project already exists:", existingProject.id);
    project = existingProject;
  } else {
    const { data: newProject, error } = await createProject({ client, body: { name: PROJECT_NAME } });
    if (error) {
      console.error("Create project error:", JSON.stringify(error, null, 2));
      throw new Error("Failed to create project");
    }
    console.log("Created project:", newProject.id);
    project = newProject;
  }

  // ── Apps ─────────────────────────────────────────────────────────────
  const { data: apps, error: listAppsError } = await listApps({
    client,
    path: { project_id: project.id },
    query: { limit: 20 },
  });
  if (listAppsError || !apps || apps.items.length === 0) throw new Error("No apps found");

  let testStoreApp: App | undefined = apps.items.find((a) => a.type === "test_store");
  let appStoreApp: App | undefined = apps.items.find((a) => a.type === "app_store");
  let playStoreApp: App | undefined = apps.items.find((a) => a.type === "play_store");

  if (!testStoreApp) throw new Error("No app with test store found");
  console.log("Test store app found:", testStoreApp.id);

  if (!appStoreApp) {
    const { data: newApp, error } = await createApp({
      client,
      path: { project_id: project.id },
      body: { name: APP_STORE_APP_NAME, type: "app_store", app_store: { bundle_id: APP_STORE_BUNDLE_ID } },
    });
    if (error) throw new Error("Failed to create App Store app");
    appStoreApp = newApp;
    console.log("Created App Store app:", appStoreApp.id);
  } else {
    console.log("App Store app found:", appStoreApp.id);
  }

  if (!playStoreApp) {
    const { data: newApp, error } = await createApp({
      client,
      path: { project_id: project.id },
      body: { name: PLAY_STORE_APP_NAME, type: "play_store", play_store: { package_name: PLAY_STORE_PACKAGE_NAME } },
    });
    if (error) throw new Error("Failed to create Play Store app");
    playStoreApp = newApp;
    console.log("Created Play Store app:", playStoreApp.id);
  } else {
    console.log("Play Store app found:", playStoreApp.id);
  }

  // ── Products ─────────────────────────────────────────────────────────
  const { data: existingProducts, error: listProductsError } = await listProducts({
    client,
    path: { project_id: project.id },
    query: { limit: 100 },
  });
  if (listProductsError) throw new Error("Failed to list products");

  const ensureProduct = async (
    targetApp: App,
    label: string,
    storeId: string,
    duration: "P1M" | "P1Y",
    displayName: string,
    isTestStore: boolean
  ): Promise<Product> => {
    const existing = existingProducts.items?.find(
      (p) => p.store_identifier === storeId && p.app_id === targetApp.id
    );
    if (existing) {
      console.log(`${label} product already exists:`, existing.id);
      return existing;
    }
    const body: CreateProductData["body"] = {
      store_identifier: storeId,
      app_id: targetApp.id,
      type: "subscription",
      display_name: displayName,
    };
    if (isTestStore) {
      body.subscription = { duration };
      body.title = displayName;
    }
    const { data: created, error } = await createProduct({ client, path: { project_id: project.id }, body });
    if (error) throw new Error(`Failed to create ${label} product`);
    console.log(`Created ${label} product:`, created.id);
    return created;
  };

  const testMonthly = await ensureProduct(testStoreApp, "Test/Monthly", MONTHLY_PRODUCT_IDENTIFIER, "P1M", "EarnIQ Pro Monthly", true);
  const testAnnual = await ensureProduct(testStoreApp, "Test/Annual", ANNUAL_PRODUCT_IDENTIFIER, "P1Y", "EarnIQ Pro Annual", true);
  const iosMonthly = await ensureProduct(appStoreApp, "iOS/Monthly", MONTHLY_PRODUCT_IDENTIFIER, "P1M", "EarnIQ Pro Monthly", false);
  const iosAnnual = await ensureProduct(appStoreApp, "iOS/Annual", ANNUAL_PRODUCT_IDENTIFIER, "P1Y", "EarnIQ Pro Annual", false);
  const androidMonthly = await ensureProduct(playStoreApp, "Android/Monthly", PLAY_STORE_MONTHLY_IDENTIFIER, "P1M", "EarnIQ Pro Monthly", false);
  const androidAnnual = await ensureProduct(playStoreApp, "Android/Annual", PLAY_STORE_ANNUAL_IDENTIFIER, "P1Y", "EarnIQ Pro Annual", false);

  await setTestStorePrices(client, project.id, testMonthly.id, MONTHLY_PRICES, "Monthly");
  await setTestStorePrices(client, project.id, testAnnual.id, ANNUAL_PRICES, "Annual");

  // ── Entitlement ───────────────────────────────────────────────────────
  const { data: existingEntitlements, error: listEntitlementsError } = await listEntitlements({
    client,
    path: { project_id: project.id },
    query: { limit: 20 },
  });
  if (listEntitlementsError) throw new Error("Failed to list entitlements");

  let entitlement: Entitlement;
  const existingEntitlement = existingEntitlements.items?.find((e) => e.lookup_key === ENTITLEMENT_IDENTIFIER);
  if (existingEntitlement) {
    console.log("Entitlement already exists:", existingEntitlement.id);
    entitlement = existingEntitlement;
  } else {
    const { data: newEnt, error } = await createEntitlement({
      client,
      path: { project_id: project.id },
      body: { lookup_key: ENTITLEMENT_IDENTIFIER, display_name: ENTITLEMENT_DISPLAY_NAME },
    });
    if (error) throw new Error("Failed to create entitlement");
    console.log("Created entitlement:", newEnt.id);
    entitlement = newEnt;
  }

  const { error: attachEntErr } = await attachProductsToEntitlement({
    client,
    path: { project_id: project.id, entitlement_id: entitlement.id },
    body: {
      product_ids: [testMonthly.id, testAnnual.id, iosMonthly.id, iosAnnual.id, androidMonthly.id, androidAnnual.id],
    },
  });
  if (attachEntErr) {
    if (attachEntErr.type === "unprocessable_entity_error") {
      console.log("Products already attached to entitlement (or partially attached, continuing)");
    } else {
      throw new Error("Failed to attach products to entitlement");
    }
  } else {
    console.log("Attached all products to entitlement");
  }

  // ── Offering ─────────────────────────────────────────────────────────
  const { data: existingOfferings, error: listOfferingsError } = await listOfferings({
    client,
    path: { project_id: project.id },
    query: { limit: 20 },
  });
  if (listOfferingsError) throw new Error("Failed to list offerings");

  let offering: Offering;
  const existingOffering = existingOfferings.items?.find((o) => o.lookup_key === OFFERING_IDENTIFIER);
  if (existingOffering) {
    console.log("Offering already exists:", existingOffering.id);
    offering = existingOffering;
  } else {
    const { data: newOff, error } = await createOffering({
      client,
      path: { project_id: project.id },
      body: { lookup_key: OFFERING_IDENTIFIER, display_name: OFFERING_DISPLAY_NAME },
    });
    if (error) throw new Error("Failed to create offering");
    console.log("Created offering:", newOff.id);
    offering = newOff;
  }

  if (!offering.is_current) {
    const { error } = await updateOffering({
      client,
      path: { project_id: project.id, offering_id: offering.id },
      body: { is_current: true },
    });
    if (error) throw new Error("Failed to set offering as current");
    console.log("Set offering as current");
  }

  // ── Packages ─────────────────────────────────────────────────────────
  const { data: existingPackages, error: listPkgErr } = await listPackages({
    client,
    path: { project_id: project.id, offering_id: offering.id },
    query: { limit: 20 },
  });
  if (listPkgErr) throw new Error("Failed to list packages");

  const ensurePackage = async (lookupKey: string, displayName: string): Promise<Package> => {
    const existing = existingPackages.items?.find((p) => p.lookup_key === lookupKey);
    if (existing) {
      console.log(`Package ${lookupKey} already exists:`, existing.id);
      return existing;
    }
    const { data: newPkg, error } = await createPackages({
      client,
      path: { project_id: project.id, offering_id: offering.id },
      body: { lookup_key: lookupKey, display_name: displayName },
    });
    if (error) throw new Error(`Failed to create package ${lookupKey}`);
    console.log(`Created package ${lookupKey}:`, newPkg.id);
    return newPkg;
  };

  const monthlyPkg = await ensurePackage(MONTHLY_PACKAGE_IDENTIFIER, MONTHLY_PACKAGE_DISPLAY_NAME);
  const annualPkg = await ensurePackage(ANNUAL_PACKAGE_IDENTIFIER, ANNUAL_PACKAGE_DISPLAY_NAME);

  const attachPkg = async (pkg: Package, products: Product[], label: string) => {
    const { error } = await attachProductsToPackage({
      client,
      path: { project_id: project.id, package_id: pkg.id },
      body: {
        products: products.map((p) => ({ product_id: p.id, eligibility_criteria: "all" as const })),
      },
    });
    if (error) {
      if (error.type === "unprocessable_entity_error") {
        console.log(`${label}: products already attached or incompatible, skipping`);
      } else {
        throw new Error(`Failed to attach products to ${label} package`);
      }
    } else {
      console.log(`Attached products to ${label} package`);
    }
  };

  await attachPkg(monthlyPkg, [testMonthly, iosMonthly, androidMonthly], "Monthly");
  await attachPkg(annualPkg, [testAnnual, iosAnnual, androidAnnual], "Annual");

  // ── API Keys ──────────────────────────────────────────────────────────
  const { data: testKeys, error: testKeysErr } = await listAppPublicApiKeys({
    client, path: { project_id: project.id, app_id: testStoreApp.id },
  });
  if (testKeysErr) throw new Error("Failed to list test store API keys");

  const { data: iosKeys, error: iosKeysErr } = await listAppPublicApiKeys({
    client, path: { project_id: project.id, app_id: appStoreApp.id },
  });
  if (iosKeysErr) throw new Error("Failed to list iOS API keys");

  const { data: androidKeys, error: androidKeysErr } = await listAppPublicApiKeys({
    client, path: { project_id: project.id, app_id: playStoreApp.id },
  });
  if (androidKeysErr) throw new Error("Failed to list Android API keys");

  console.log("\n====================");
  console.log("RevenueCat setup complete!");
  console.log("Project ID:", project.id);
  console.log("Test Store App ID:", testStoreApp.id);
  console.log("Apple App Store App ID:", appStoreApp.id);
  console.log("Google Play Store App ID:", playStoreApp.id);
  console.log("Entitlement:", ENTITLEMENT_IDENTIFIER);
  console.log("Public API Keys - Test Store:", testKeys?.items.map((k) => k.key).join(", ") ?? "N/A");
  console.log("Public API Keys - App Store:", iosKeys?.items.map((k) => k.key).join(", ") ?? "N/A");
  console.log("Public API Keys - Play Store:", androidKeys?.items.map((k) => k.key).join(", ") ?? "N/A");
  console.log("====================\n");
}

seedRevenueCat().catch(console.error);
