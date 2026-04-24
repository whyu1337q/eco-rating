const SESSION_KEY = "eco-rating-session-v4";
const LAST_ACCOUNT_KEY = "eco-rating-last-account-v1";
const APPEARANCE_KEY = "eco-rating-appearance-v1";
const MOBILE_SECTIONS = ["overview", "entry", "leaderboard", "history"];
const FRACTIONS = [
  "Пластик",
  "Бумага",
  "Металл",
  "Стекло",
  "Картон",
  "Электроника",
  "Другое"
];
const COUNTRIES = [
  { code: "RU", flag: "🇷🇺", name: "Россия", dialCode: "+7", placeholder: "900 000 00 00" },
  { code: "US", flag: "🇺🇸", name: "США", dialCode: "+1", placeholder: "201 555 0123" },
  { code: "CA", flag: "🇨🇦", name: "Канада", dialCode: "+1", placeholder: "416 555 0123" },
  { code: "KZ", flag: "🇰🇿", name: "Казахстан", dialCode: "+7", placeholder: "701 000 00 00" },
  { code: "BY", flag: "🇧🇾", name: "Беларусь", dialCode: "+375", placeholder: "29 123 45 67" },
  { code: "DE", flag: "🇩🇪", name: "Германия", dialCode: "+49", placeholder: "1512 3456789" },
  { code: "FR", flag: "🇫🇷", name: "Франция", dialCode: "+33", placeholder: "6 12 34 56 78" },
  { code: "AE", flag: "🇦🇪", name: "ОАЭ", dialCode: "+971", placeholder: "50 123 4567" },
  { code: "IN", flag: "🇮🇳", name: "Индия", dialCode: "+91", placeholder: "98765 43210" },
  { code: "BR", flag: "🇧🇷", name: "Бразилия", dialCode: "+55", placeholder: "11 91234 5678" }
];
const DEFAULT_COUNTRY_CODE = "RU";
const PROFILE_SELECT_FIELDS = "id, name, phone, created_at";
const PROFILE_SELECT_FIELDS_WITH_COUNTRY_CODE = "id, name, phone, country_code, created_at";
const DISALLOWED_PROFILE_NAME_FRAGMENTS = [
  "бляд",
  "блят",
  "пизд",
  "хуй",
  "хуе",
  "хуя",
  "ебан",
  "ебат",
  "ебуч",
  "ебал",
  "уеб",
  "уёб",
  "мудак",
  "гандон",
  "пидор",
  "пидар",
  "педик",
  "залуп",
  "шлюх",
  "мраз",
  "ублюд",
  "долбо",
  "дебил",
  "идиот",
  "fuck",
  "shit",
  "bitch",
  "asshole",
  "cunt",
  "bastard",
  "whore",
  "slut",
  "moron"
];
const NAME_MODERATION_SUBSTITUTIONS = {
  "0": "о",
  "1": "и",
  "3": "з",
  "4": "а",
  "5": "с",
  "6": "б",
  "7": "т",
  "8": "в",
  "@": "а",
  "$": "с",
  "+": "т"
};
const LATIN_TO_CYRILLIC_LOOKALIKES = {
  a: "а",
  b: "в",
  c: "с",
  e: "е",
  h: "н",
  k: "к",
  m: "м",
  o: "о",
  p: "р",
  t: "т",
  x: "х",
  y: "у"
};

const state = {
  client: null,
  realtimeChannel: null,
  currentUserId: loadSessionUserId(),
  users: [],
  entries: [],
  isConfigured: false,
  isBusy: false,
  liveStatus: "offline",
  lastSyncAt: null,
  platform: detectPlatformFlavor(),
  appearance: loadAppearance(),
  resolvedAppearance: "light",
  systemThemeMedia: null,
  supportsProfileCountryCode: true,
  lastAccount: loadLastAccount(),
  mobileSection: "entry"
};

const els = {
  authView: document.querySelector("#authView"),
  dashboardView: document.querySelector("#dashboardView"),
  authForm: document.querySelector("#authForm"),
  countryInput: document.querySelector("#countryInput"),
  nameInput: document.querySelector("#nameInput"),
  phoneInput: document.querySelector("#phoneInput"),
  lastAccountCard: document.querySelector("#lastAccountCard"),
  lastAccountName: document.querySelector("#lastAccountName"),
  lastAccountPhone: document.querySelector("#lastAccountPhone"),
  lastAccountButton: document.querySelector("#lastAccountButton"),
  authError: document.querySelector("#authError"),
  authSubmitButton: document.querySelector("#authSubmitButton"),
  entryForm: document.querySelector("#entryForm"),
  fractionInput: document.querySelector("#fractionInput"),
  weightInput: document.querySelector("#weightInput"),
  commentInput: document.querySelector("#commentInput"),
  entryError: document.querySelector("#entryError"),
  entrySubmitButton: document.querySelector("#entrySubmitButton"),
  currentUserName: document.querySelector("#currentUserName"),
  currentUserPhone: document.querySelector("#currentUserPhone"),
  logoutButton: document.querySelector("#logoutButton"),
  appearanceSelect: document.querySelector("#appearanceSelect"),
  refreshButton: document.querySelector("#refreshButton"),
  myTotalWeight: document.querySelector("#myTotalWeight"),
  myRankText: document.querySelector("#myRankText"),
  globalTotalWeight: document.querySelector("#globalTotalWeight"),
  globalEntriesText: document.querySelector("#globalEntriesText"),
  usersCount: document.querySelector("#usersCount"),
  topFraction: document.querySelector("#topFraction"),
  topFractionWeight: document.querySelector("#topFractionWeight"),
  fractionBars: document.querySelector("#fractionBars"),
  ratingFractionFilter: document.querySelector("#ratingFractionFilter"),
  ratingSort: document.querySelector("#ratingSort"),
  leaderboardBody: document.querySelector("#leaderboardBody"),
  leaderboardCards: document.querySelector("#leaderboardCards"),
  historyList: document.querySelector("#historyList"),
  syncBadgeLogin: document.querySelector("#syncBadgeLogin"),
  syncBadgeDashboard: document.querySelector("#syncBadgeDashboard"),
  syncMeta: document.querySelector("#syncMeta"),
  themeColorMeta: document.querySelector('meta[name="theme-color"]'),
  mobileSectionButtons: document.querySelectorAll("[data-mobile-section-button]"),
  mobilePanes: document.querySelectorAll("[data-mobile-pane]")
};

els.authForm.addEventListener("submit", handleAuth);
els.countryInput.addEventListener("change", handleCountryChange);
els.entryForm.addEventListener("submit", handleEntry);
els.logoutButton.addEventListener("click", handleLogout);
els.lastAccountButton.addEventListener("click", handleLastAccountLogin);
els.appearanceSelect?.addEventListener("change", handleAppearanceChange);
els.ratingFractionFilter.addEventListener("change", renderDashboard);
els.ratingSort.addEventListener("change", renderDashboard);
els.refreshButton.addEventListener("click", () => refreshRemoteData({ quiet: false }));
Array.from(els.mobileSectionButtons).forEach((button) => {
  button.addEventListener("click", handleMobileSectionSelect);
});

bootstrap();

async function bootstrap() {
  applyPlatformTheme();
  initializeAppearance();
  initializeCountrySelect();
  hydrateLastAccountDraft();
  updateLiveStatus("offline", "Нет подключения к Supabase");
  toggleBusy(false);
  render();

  const config = await resolveSupabaseConfig();
  if (!config) {
    els.authError.textContent = "Заполните app/supabase-config.txt и перезапустите приложение.";
    return;
  }

  await connectSupabase(config);
}

function detectPlatformFlavor() {
  const shellPlatform = window.ecoShell?.platform;
  const userAgent = navigator.userAgent.toLowerCase();

  if (shellPlatform === "win32" || userAgent.includes("windows")) {
    return "windows";
  }

  if (shellPlatform === "linux" || userAgent.includes("linux")) {
    return userAgent.includes("android") ? "android" : "linux";
  }

  if (userAgent.includes("android")) {
    return "android";
  }

  return "windows";
}

function applyPlatformTheme() {
  document.documentElement.dataset.platform = state.platform;
  document.body.dataset.platform = state.platform;
  applyAppearance();
}

function initializeAppearance() {
  if (window.matchMedia) {
    state.systemThemeMedia = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      if (state.appearance === "system") {
        applyAppearance();
      }
    };

    if (typeof state.systemThemeMedia.addEventListener === "function") {
      state.systemThemeMedia.addEventListener("change", handleSystemThemeChange);
    } else if (typeof state.systemThemeMedia.addListener === "function") {
      state.systemThemeMedia.addListener(handleSystemThemeChange);
    }
  }

  if (els.appearanceSelect) {
    els.appearanceSelect.value = state.appearance;
  }

  applyAppearance();
}

function handleAppearanceChange(event) {
  setAppearance(event.target.value);
}

function setAppearance(nextAppearance) {
  if (!["system", "light", "dark"].includes(nextAppearance)) {
    return;
  }

  state.appearance = nextAppearance;
  saveAppearance(nextAppearance);

  if (els.appearanceSelect && els.appearanceSelect.value !== nextAppearance) {
    els.appearanceSelect.value = nextAppearance;
  }

  applyAppearance();
}

function applyAppearance() {
  const resolvedAppearance = resolveAppearance(state.appearance);
  state.resolvedAppearance = resolvedAppearance;

  document.documentElement.dataset.appearance = state.appearance;
  document.documentElement.dataset.resolvedAppearance = resolvedAppearance;
  document.body.dataset.appearance = state.appearance;
  document.body.dataset.resolvedAppearance = resolvedAppearance;

  updateThemeColor();
}

function resolveAppearance(appearance) {
  if (appearance === "light" || appearance === "dark") {
    return appearance;
  }

  return state.systemThemeMedia?.matches ? "dark" : "light";
}

function updateThemeColor() {
  if (!els.themeColorMeta) {
    return;
  }

  if (state.resolvedAppearance === "dark") {
    els.themeColorMeta.setAttribute("content", state.platform === "android" ? "#171411" : "#18161a");
    return;
  }

  if (state.platform === "android") {
    els.themeColorMeta.setAttribute("content", "#fcf8fa");
    return;
  }

  if (state.platform === "linux") {
    els.themeColorMeta.setAttribute("content", "#f8f4f7");
    return;
  }

  els.themeColorMeta.setAttribute("content", "#fcf8fa");
}

async function connectSupabase(config) {
  els.authError.textContent = "";
  els.entryError.textContent = "";

  if (!window.supabase || typeof window.supabase.createClient !== "function") {
    els.authError.textContent = "Клиент Supabase не найден в приложении.";
    return;
  }

  destroyRealtime();
  state.client = null;
  state.isConfigured = false;
  toggleBusy(true, "Подключаемся к Supabase...");

  try {
    state.client = window.supabase.createClient(config.url, config.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    state.supportsProfileCountryCode = true;
    state.isConfigured = true;
    await refreshRemoteData({ quiet: false });
    setupRealtime();
  } catch (error) {
    state.client = null;
    state.isConfigured = false;
    updateLiveStatus("error", "Ошибка подключения");
    els.authError.textContent = humanizeError(error, "Не удалось подключиться к Supabase.");
  } finally {
    toggleBusy(false);
    render();
  }
}

function getProfilesSelectFields() {
  return state.supportsProfileCountryCode
    ? PROFILE_SELECT_FIELDS_WITH_COUNTRY_CODE
    : PROFILE_SELECT_FIELDS;
}

function isMissingProfileCountryCodeError(error) {
  if (!error) {
    return false;
  }

  const message = typeof error === "string"
    ? error
    : error.message ?? error.details ?? error.hint ?? "";

  return /profiles/i.test(message) && /country_code/i.test(message);
}

function resolveProfileCountryCode(phone, explicitCountryCode = null) {
  return getCountryByCode(explicitCountryCode)?.code ?? findCountryByPhone(normalizePhone(phone)).code;
}

function normalizeProfileRecord(profile) {
  if (!profile) {
    return null;
  }

  return {
    ...profile,
    country_code: resolveProfileCountryCode(profile.phone, profile.country_code ?? null)
  };
}

function buildProfileMutation(values) {
  if (!values) {
    return values;
  }

  if (Array.isArray(values)) {
    return values.map((value) => buildProfileMutation(value));
  }

  if (!state.supportsProfileCountryCode) {
    const { country_code, ...profileWithoutCountryCode } = values;
    return profileWithoutCountryCode;
  }

  return values;
}

async function runProfilesRequest(executor, values = null) {
  const buildRequest = () => executor({
    selectFields: getProfilesSelectFields(),
    values: buildProfileMutation(values)
  });

  let result = await buildRequest();

  if (result.error && state.supportsProfileCountryCode && isMissingProfileCountryCodeError(result.error)) {
    state.supportsProfileCountryCode = false;
    renderSupabaseHint();
    result = await buildRequest();
  }

  if (!result.error && result.data) {
    result.data = Array.isArray(result.data)
      ? result.data.map((profile) => normalizeProfileRecord(profile))
      : normalizeProfileRecord(result.data);
  }

  return result;
}

async function findProfileByPhone(phone) {
  return runProfilesRequest(({ selectFields }) =>
    state.client
      .from("profiles")
      .select(selectFields)
      .eq("phone", phone)
      .maybeSingle()
  );
}

async function insertProfile(values) {
  const expectsMany = Array.isArray(values);

  return runProfilesRequest(({ selectFields, values: profileValues }) => {
    const request = state.client
      .from("profiles")
      .insert(profileValues)
      .select(selectFields);

    return expectsMany ? request : request.single();
  }, values);
}

async function updateProfile(profileId, values) {
  const profileValues = buildProfileMutation(values);

  if (!profileValues || Object.keys(profileValues).length === 0) {
    return { data: null, error: null };
  }

  return runProfilesRequest(({ selectFields, values: nextProfileValues }) =>
    state.client
      .from("profiles")
      .update(nextProfileValues)
      .eq("id", profileId)
      .select(selectFields)
      .single(),
    profileValues
  );
}

async function listProfiles() {
  return runProfilesRequest(({ selectFields }) =>
    state.client
      .from("profiles")
      .select(selectFields)
      .order("created_at", { ascending: true })
  );
}

async function handleAuth(event) {
  event.preventDefault();
  els.authError.textContent = "";

  if (!state.client) {
    els.authError.textContent = "Настройте Supabase через app/supabase-config.txt.";
    return;
  }

  const selectedCountry = getSelectedCountry();
  const phone = buildFullPhone(selectedCountry, els.phoneInput.value);
  const name = normalizeProfileName(els.nameInput.value);

  els.nameInput.value = name;

  if (!isValidPhone(phone)) {
    els.authError.textContent = "Введите корректный номер: от 10 до 15 цифр.";
    return;
  }

  toggleBusy(true, "Сохраняем профиль...");

  try {
    const { data: existingUser, error: selectError } = await findProfileByPhone(phone);

    if (selectError) {
      throw selectError;
    }

    let currentUser = existingUser;

    if (!currentUser) {
      const newProfileNameError = validateProfileName(name, { required: true });
      if (newProfileNameError) {
        els.authError.textContent = newProfileNameError;
        return;
      }

      const { data: insertedUser, error: insertError } = await insertProfile({
        name,
        phone,
        country_code: selectedCountry.code
      });

      if (insertError) {
        throw insertError;
      }

      currentUser = insertedUser;
    } else {
      const nextValues = {};

      if (name.length > 0) {
        const normalizedExistingName = normalizeProfileName(currentUser.name);

        if (!isMatchingProfileName(name, normalizedExistingName)) {
          els.authError.textContent = `Этот номер уже привязан к имени «${normalizedExistingName}». Используйте его для входа.`;
          return;
        }
      }

      if (state.supportsProfileCountryCode && currentUser.country_code !== selectedCountry.code) {
        nextValues.country_code = selectedCountry.code;
      }

      if (Object.keys(nextValues).length > 0) {
        const { data: updatedUser, error: updateError } = await updateProfile(currentUser.id, nextValues);

        if (updateError) {
          throw updateError;
        }

        if (updatedUser) {
          currentUser = updatedUser;
        }
      }
    }

    state.currentUserId = currentUser.id;
    saveSessionUserId(currentUser.id);
    saveLastAccount(currentUser);
    setMobileSection("entry", { scroll: false });
    applyPhoneToForm(currentUser.phone, currentUser.country_code);
    await refreshRemoteData({ quiet: true });
    render();
  } catch (error) {
    els.authError.textContent = humanizeError(error, "Не удалось выполнить вход.");
  } finally {
    toggleBusy(false);
  }
}

async function handleEntry(event) {
  event.preventDefault();
  els.entryError.textContent = "";

  const user = getCurrentUser();
  const fraction = els.fractionInput.value;
  const weight = Number.parseFloat(els.weightInput.value);
  const comment = els.commentInput.value.trim();

  if (!state.client) {
    els.entryError.textContent = "Нет активного подключения к Supabase.";
    return;
  }

  if (!user) {
    els.entryError.textContent = "Сначала войдите по номеру телефона.";
    return;
  }

  if (!FRACTIONS.includes(fraction)) {
    els.entryError.textContent = "Выберите корректную фракцию.";
    return;
  }

  if (!Number.isFinite(weight) || weight <= 0 || weight > 10000) {
    els.entryError.textContent = "Вес должен быть больше 0 и не больше 10000 кг.";
    return;
  }

  toggleBusy(true, "Сохраняем запись...");

  try {
    const { error } = await state.client
      .from("recycling_entries")
      .insert({
        user_id: user.id,
        fraction,
        weight: roundWeight(weight),
        comment: comment || null
      });

    if (error) {
      throw error;
    }

    els.entryForm.reset();
    els.fractionInput.value = "Пластик";
    await refreshRemoteData({ quiet: true });
  } catch (error) {
    els.entryError.textContent = humanizeError(error, "Не удалось сохранить сдачу.");
  } finally {
    toggleBusy(false);
  }
}

function handleLogout() {
  const user = getCurrentUser();
  if (user) {
    saveLastAccount({
      id: user.id,
      name: user.name,
      phone: user.phone,
      country_code: user.countryCode
    });
  }

  state.currentUserId = null;
  saveSessionUserId(null);
  hydrateLastAccountDraft(true);
  render();
}

function handleLastAccountLogin() {
  if (!state.lastAccount) {
    return;
  }

  hydrateLastAccountDraft(true);

  if (state.client) {
    els.authForm.requestSubmit();
  }
}

function handleMobileSectionSelect(event) {
  setMobileSection(event.currentTarget.dataset.mobileSectionButton);
}

async function refreshRemoteData(options = {}) {
  if (!state.client) {
    return;
  }

  const quiet = options.quiet ?? false;

  if (!quiet) {
    updateLiveStatus("syncing", "Синхронизация с Supabase...");
  }

  try {
    const [usersResult, entriesResult] = await Promise.all([
      listProfiles(),
      state.client
        .from("recycling_entries")
        .select("id, user_id, fraction, weight, comment, created_at")
        .order("created_at", { ascending: false })
    ]);

    if (usersResult.error) {
      throw usersResult.error;
    }

    if (entriesResult.error) {
      throw entriesResult.error;
    }

    state.users = (usersResult.data ?? []).map((user) => ({
      id: user.id,
      name: user.name,
      phone: user.phone,
      countryCode: user.country_code,
      createdAt: user.created_at
    }));

    state.entries = (entriesResult.data ?? []).map((entry) => ({
      id: entry.id,
      userId: entry.user_id,
      fraction: entry.fraction,
      weight: Number(entry.weight),
      comment: entry.comment ?? "",
      createdAt: entry.created_at
    }));

    if (state.currentUserId && !state.users.some((user) => user.id === state.currentUserId)) {
      state.currentUserId = null;
      saveSessionUserId(null);
    }

    const currentUser = state.users.find((user) => user.id === state.currentUserId);
    if (currentUser) {
      saveLastAccount({
        id: currentUser.id,
        name: currentUser.name,
        phone: currentUser.phone,
        country_code: currentUser.countryCode
      });
    }

    state.lastSyncAt = new Date().toISOString();
    updateLiveStatus("online", `Синхронизировано ${formatTime(state.lastSyncAt)}`);
    render();
  } catch (error) {
    updateLiveStatus("error", humanizeError(error, "Ошибка синхронизации."));
    if (!quiet) {
      els.entryError.textContent = humanizeError(error, "Не удалось обновить данные.");
    }
  }
}

function setupRealtime() {
  if (!state.client) {
    return;
  }

  destroyRealtime();

  state.realtimeChannel = state.client
    .channel("eco-rating-live")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "profiles" },
      handleRealtimeChange
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "recycling_entries" },
      handleRealtimeChange
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED") {
        updateLiveStatus(
          "online",
          state.lastSyncAt
            ? `Live-канал активен, синхронизация ${formatTime(state.lastSyncAt)}`
            : "Live-канал активен"
        );
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        updateLiveStatus("error", "Realtime недоступен, используйте ручное обновление.");
      } else if (status === "CLOSED") {
        updateLiveStatus("offline", "Live-канал закрыт.");
      }
    });
}

let refreshTimer = null;

function handleRealtimeChange() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => {
    refreshRemoteData({ quiet: true });
  }, 250);
}

function destroyRealtime() {
  if (state.realtimeChannel && state.client) {
    state.client.removeChannel(state.realtimeChannel);
  }

  state.realtimeChannel = null;
}

function render() {
  const user = getCurrentUser();
  const isLoggedIn = Boolean(user);

  els.authView.classList.toggle("is-hidden", isLoggedIn);
  els.dashboardView.classList.toggle("is-hidden", !isLoggedIn);
  renderMobileSectionNavigation();

  if (isLoggedIn) {
    renderDashboard();
    return;
  }

  renderAuthView();
}

function renderDashboard() {
  const user = getCurrentUser();
  if (!user) {
    return;
  }

  const allTotals = calculateUserTotals("all");
  const currentRank = allTotals.findIndex((item) => item.user.id === user.id) + 1;
  const currentTotal = allTotals.find((item) => item.user.id === user.id)?.weight ?? 0;
  const globalWeight = state.entries.reduce((sum, entry) => sum + entry.weight, 0);
  const topFraction = getTopFraction(state.entries);

  els.currentUserName.textContent = user.name;
  els.currentUserPhone.textContent = formatPhoneWithCountry(user.phone, user.countryCode);
  els.myTotalWeight.textContent = formatKg(currentTotal);
  els.myRankText.textContent = currentRank > 0
    ? `${currentRank} место из ${allTotals.length}`
    : "Рейтинг появится после первой сдачи";
  els.globalTotalWeight.textContent = formatKg(globalWeight);
  els.globalEntriesText.textContent = pluralizeRecords(state.entries.length);
  els.usersCount.textContent = String(state.users.length);
  els.topFraction.textContent = topFraction ? topFraction.fraction : "-";
  els.topFractionWeight.textContent = topFraction
    ? formatKg(topFraction.weight)
    : "Нет данных";

  renderFractionBars(user.id);
  renderLeaderboard();
  renderHistory(user.id);
}

function renderAuthView() {
  const lastAccount = state.lastAccount;
  const hasLastAccount = Boolean(lastAccount?.phone);

  els.lastAccountCard.classList.toggle("is-hidden", !hasLastAccount);

  if (!hasLastAccount) {
    return;
  }

  els.lastAccountName.textContent = lastAccount.name || "Последний аккаунт";
  els.lastAccountPhone.textContent = formatPhoneWithCountry(lastAccount.phone, lastAccount.countryCode);
}

function renderMobileSectionNavigation() {
  document.documentElement.dataset.mobileSection = state.mobileSection;

  Array.from(els.mobileSectionButtons).forEach((button) => {
    button.classList.toggle("is-active", button.dataset.mobileSectionButton === state.mobileSection);
  });

  Array.from(els.mobilePanes).forEach((pane) => {
    if (state.platform !== "android") {
      pane.classList.remove("is-hidden");
      return;
    }

    pane.classList.toggle("is-hidden", pane.dataset.mobilePane !== state.mobileSection);
  });
}

function setMobileSection(section, options = {}) {
  if (!MOBILE_SECTIONS.includes(section)) {
    return;
  }

  state.mobileSection = section;
  renderMobileSectionNavigation();

  if ((options.scroll ?? true) && state.platform === "android") {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function renderFractionBars(userId) {
  const entries = state.entries.filter((entry) => entry.userId === userId);
  const totals = groupFractionTotals(entries);
  const maxWeight = Math.max(...totals.map((item) => item.weight), 0);

  if (totals.length === 0) {
    els.fractionBars.className = "bars-list empty-state";
    els.fractionBars.textContent = "Нет данных по фракциям.";
    return;
  }

  els.fractionBars.className = "bars-list";
  els.fractionBars.innerHTML = totals
    .map((item) => {
      const width = maxWeight === 0 ? 0 : Math.max((item.weight / maxWeight) * 100, 5);
      return `
        <div class="bar-row">
          <div class="bar-meta">
            <span>${escapeHtml(item.fraction)}</span>
            <span>${formatKg(item.weight)}</span>
          </div>
          <div class="bar-track" aria-hidden="true">
            <div class="bar-fill" style="width: ${width}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderLeaderboard() {
  const fraction = els.ratingFractionFilter.value;
  const sort = els.ratingSort.value;
  const currentUserId = state.currentUserId;
  let totals = calculateUserTotals(fraction);

  if (sort === "name") {
    totals = totals.sort((a, b) => a.user.name.localeCompare(b.user.name, "ru"));
  }

  if (sort === "entries") {
    totals = totals.sort((a, b) => b.entries - a.entries || b.weight - a.weight);
  }

  renderLeaderboardCards(totals, currentUserId);

  if (totals.length === 0) {
    els.leaderboardBody.innerHTML = `
      <tr>
        <td colspan="4">Пока нет данных для рейтинга.</td>
      </tr>
    `;
    return;
  }

  els.leaderboardBody.innerHTML = totals
    .map((item, index) => `
      <tr class="${item.user.id === currentUserId ? "current-user" : ""}">
        <td><span class="rank-pill">${index + 1}</span></td>
        <td>${escapeHtml(item.user.name)}</td>
        <td>${item.entries}</td>
        <td>${formatKg(item.weight)}</td>
      </tr>
    `)
    .join("");
}

function renderLeaderboardCards(totals, currentUserId) {
  if (totals.length === 0) {
    els.leaderboardCards.className = "leaderboard-cards empty-state";
    els.leaderboardCards.textContent = "Пока нет данных для рейтинга.";
    return;
  }

  els.leaderboardCards.className = "leaderboard-cards";
  els.leaderboardCards.innerHTML = totals
    .map((item, index) => `
      <article class="leaderboard-card ${item.user.id === currentUserId ? "is-current" : ""}">
        <div class="leaderboard-card-top">
          <span class="rank-pill">${index + 1}</span>
          <div class="leaderboard-card-title">
            <strong>${escapeHtml(item.user.name)}</strong>
            <small>${item.user.id === currentUserId ? "Ваш аккаунт" : "Участник"}</small>
          </div>
        </div>
        <div class="leaderboard-card-metrics">
          <div class="leaderboard-card-metric">
            <span>Сдач</span>
            <strong>${item.entries}</strong>
          </div>
          <div class="leaderboard-card-metric">
            <span>Вес</span>
            <strong>${formatKg(item.weight)}</strong>
          </div>
        </div>
      </article>
    `)
    .join("");
}

function renderHistory(userId) {
  const recent = state.entries
    .filter((entry) => entry.userId === userId)
    .slice(0, state.platform === "android" ? 5 : 8);

  if (recent.length === 0) {
    els.historyList.className = "history-list empty-state";
    els.historyList.textContent = "Записей пока нет.";
    return;
  }

  els.historyList.className = "history-list";
  els.historyList.innerHTML = recent
    .map((entry) => {
      const comment = entry.comment ? ` · ${escapeHtml(entry.comment)}` : "";
      return `
        <article class="history-item">
          <div>
            <strong>${escapeHtml(entry.fraction)}</strong>
            <span>${formatDate(entry.createdAt)}${comment}</span>
          </div>
          <div class="weight">${formatKg(entry.weight)}</div>
        </article>
      `;
    })
    .join("");
}

async function resolveSupabaseConfig() {
  const configText = await loadSupabaseConfigText();
  if (!configText) {
    return null;
  }

  const config = parseConfigText(configText);
  if (!config.url || !config.anonKey) {
    return null;
  }

  return config;
}

function initializeCountrySelect() {
  els.countryInput.innerHTML = COUNTRIES
    .map((country) => `
      <option value="${country.code}">
        ${country.flag} ${country.name} (${country.dialCode})
      </option>
    `)
    .join("");

  els.countryInput.value = DEFAULT_COUNTRY_CODE;
  updatePhonePlaceholder();
}

function handleCountryChange() {
  updatePhonePlaceholder();
}

function updatePhonePlaceholder() {
  els.phoneInput.placeholder = getSelectedCountry().placeholder;
}

function getSelectedCountry() {
  return COUNTRIES.find((country) => country.code === els.countryInput.value) ?? COUNTRIES[0];
}

function getCountryByCode(countryCode) {
  return COUNTRIES.find((country) => country.code === countryCode) ?? null;
}

function buildFullPhone(country, phoneValue) {
  let localDigits = phoneValue.trim().replace(/\D/g, "");
  const countryDigits = country.dialCode.replace(/\D/g, "");
  if (localDigits.startsWith(countryDigits)) {
    localDigits = localDigits.slice(countryDigits.length);
  }
  return localDigits ? `+${countryDigits}${localDigits}` : "";
}

function findCountryByPhone(phone) {
  const candidates = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
  return candidates.find((country) => phone.startsWith(country.dialCode)) ?? COUNTRIES[0];
}

function applyPhoneToForm(phone, explicitCountryCode = null) {
  const country = getCountryByCode(explicitCountryCode) ?? findCountryByPhone(phone);
  const dialDigits = country.dialCode.replace(/\D/g, "");
  const fullDigits = phone.replace(/\D/g, "");
  const localDigits = fullDigits.startsWith(dialDigits)
    ? fullDigits.slice(dialDigits.length)
    : fullDigits;

  els.countryInput.value = country.code;
  updatePhonePlaceholder();
  els.phoneInput.value = localDigits;
}

function hydrateLastAccountDraft(force = false) {
  if (!state.lastAccount) {
    return;
  }

  if (force || !els.phoneInput.value.trim()) {
    applyPhoneToForm(state.lastAccount.phone, state.lastAccount.countryCode);
  }

  if (force || !els.nameInput.value.trim()) {
    els.nameInput.value = state.lastAccount.name ?? "";
  }
}

async function loadSupabaseConfigText() {
  if (window.ecoShell?.readBundledTextFile) {
    try {
      return await window.ecoShell.readBundledTextFile("supabase-config.txt");
    } catch {
      return "";
    }
  }

  try {
    const response = await fetch("./supabase-config.txt", { cache: "no-store" });
    if (!response.ok) {
      return "";
    }

    return await response.text();
  } catch {
    return "";
  }
}

function parseConfigText(text) {
  const config = {
    url: "",
    anonKey: ""
  };

  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .forEach((line) => {
      const separatorIndex = line.indexOf("=");
      if (separatorIndex === -1) {
        return;
      }

      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim();

      if (key === "SUPABASE_URL") {
        config.url = value;
      }

      if (key === "SUPABASE_ANON_KEY") {
        config.anonKey = value;
      }
    });

  return config;
}

function calculateUserTotals(fraction) {
  return state.users
    .map((user) => {
      const entries = state.entries.filter((entry) => {
        const sameUser = entry.userId === user.id;
        return sameUser && (fraction === "all" || entry.fraction === fraction);
      });

      return {
        user,
        weight: roundWeight(entries.reduce((sum, entry) => sum + entry.weight, 0)),
        entries: entries.length
      };
    })
    .filter((item) => item.weight > 0 || item.user.id === state.currentUserId)
    .sort((a, b) => b.weight - a.weight || a.user.name.localeCompare(b.user.name, "ru"));
}

function groupFractionTotals(entries) {
  const map = new Map();
  entries.forEach((entry) => {
    map.set(entry.fraction, (map.get(entry.fraction) ?? 0) + entry.weight);
  });

  return [...map.entries()]
    .map(([fraction, weight]) => ({ fraction, weight: roundWeight(weight) }))
    .sort((a, b) => b.weight - a.weight);
}

function getTopFraction(entries) {
  return groupFractionTotals(entries)[0] ?? null;
}

function getCurrentUser() {
  return state.users.find((user) => user.id === state.currentUserId) ?? null;
}

function updateLiveStatus(status, detail) {
  state.liveStatus = status;

  [els.syncBadgeLogin, els.syncBadgeDashboard].forEach((badge) => {
    badge.className = `status-badge ${status}`;
    badge.textContent = statusLabel(status);
  });

  els.syncMeta.textContent = detail;
}

function statusLabel(status) {
  switch (status) {
    case "online":
      return "Онлайн";
    case "syncing":
      return "Синхр.";
    case "error":
      return "Ошибка";
    default:
      return "Оффлайн";
  }
}

function toggleBusy(isBusy, hint = "") {
  state.isBusy = isBusy;

  els.authSubmitButton.disabled = isBusy || !state.isConfigured;
  els.entrySubmitButton.disabled = isBusy || !state.isConfigured;
  els.refreshButton.disabled = isBusy || !state.isConfigured;

  if (hint) {
    els.syncMeta.textContent = hint;
  }
}

function loadSessionUserId() {
  return localStorage.getItem(SESSION_KEY);
}

function saveSessionUserId(userId) {
  if (!userId) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }

  localStorage.setItem(SESSION_KEY, userId);
}

function loadLastAccount() {
  try {
    const value = localStorage.getItem(LAST_ACCOUNT_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function saveLastAccount(profile) {
  if (!profile?.phone) {
    return;
  }

  const nextLastAccount = {
    id: profile.id ?? null,
    name: normalizeProfileName(profile.name ?? ""),
    phone: profile.phone,
    countryCode: profile.country_code ?? profile.countryCode ?? resolveProfileCountryCode(profile.phone)
  };

  if (
    state.lastAccount?.id === nextLastAccount.id
    && state.lastAccount?.name === nextLastAccount.name
    && state.lastAccount?.phone === nextLastAccount.phone
    && state.lastAccount?.countryCode === nextLastAccount.countryCode
  ) {
    return;
  }

  state.lastAccount = nextLastAccount;
  localStorage.setItem(LAST_ACCOUNT_KEY, JSON.stringify(nextLastAccount));
}

function loadAppearance() {
  const value = localStorage.getItem(APPEARANCE_KEY);
  return ["system", "light", "dark"].includes(value) ? value : "system";
}

function saveAppearance(value) {
  if (value === "system") {
    localStorage.removeItem(APPEARANCE_KEY);
    return;
  }

  localStorage.setItem(APPEARANCE_KEY, value);
}

function normalizeProfileName(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function isMatchingProfileName(leftName, rightName) {
  return normalizeProfileName(leftName).localeCompare(normalizeProfileName(rightName), "ru", { sensitivity: "accent" }) === 0;
}

function normalizeNameForModeration(value) {
  const normalized = normalizeProfileName(value)
    .normalize("NFKC")
    .toLowerCase();
  const substituted = Array.from(normalized)
    .map((char) => NAME_MODERATION_SUBSTITUTIONS[char] ?? char)
    .join("");
  const compact = substituted.replace(/[\s'".,!?_\-+=*()[\]{}\\/|`~:;]+/g, "");
  const cyrillic = Array.from(compact)
    .map((char) => LATIN_TO_CYRILLIC_LOOKALIKES[char] ?? char)
    .join("")
    .replaceAll("ё", "е");

  return {
    compact,
    cyrillic
  };
}

function validateProfileName(name, options = {}) {
  const required = options.required ?? false;
  const normalizedName = normalizeProfileName(name);

  if (!normalizedName) {
    return required ? "Для нового пользователя укажите имя." : "";
  }

  if (normalizedName.length < 2) {
    return "Имя должно содержать минимум 2 символа.";
  }

  const { compact, cyrillic } = normalizeNameForModeration(normalizedName);
  const hasDisallowedFragment = DISALLOWED_PROFILE_NAME_FRAGMENTS.some((fragment) => (
    compact.includes(fragment) || cyrillic.includes(fragment)
  ));

  if (hasDisallowedFragment) {
    return "Имя содержит недопустимую лексику. Укажите нейтральное имя.";
  }

  return "";
}

function normalizePhone(value) {
  const digits = value.trim().replace(/\D/g, "");
  return digits ? `+${digits}` : "";
}

function isValidPhone(phone) {
  return /^\+\d{10,15}$/.test(phone);
}

function formatPhone(phone, explicitCountryCode = null) {
  const digits = normalizePhone(phone);
  const country = getCountryByCode(explicitCountryCode) ?? findCountryByPhone(digits);
  const dialDigits = country.dialCode.replace(/\D/g, "");
  const fullDigits = digits.replace(/\D/g, "");
  const localDigits = fullDigits.startsWith(dialDigits)
    ? fullDigits.slice(dialDigits.length)
    : fullDigits;

  if (!localDigits) {
    return digits;
  }

  const groups = localDigits.match(/.{1,3}/g) ?? [localDigits];
  return `${country.dialCode} ${groups.join(" ")}`.trim();
}

function formatPhoneWithCountry(phone, explicitCountryCode = null) {
  const country = getCountryByCode(explicitCountryCode) ?? findCountryByPhone(phone);
  return `${country.flag} ${country.name} · ${formatPhone(phone, country.code)}`;
}

function formatKg(value) {
  return `${roundWeight(value).toLocaleString("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  })} кг`;
}

function roundWeight(value) {
  return Math.round((Number(value) + Number.EPSILON) * 10) / 10;
}

function pluralizeRecords(count) {
  const lastTwo = count % 100;
  const last = count % 10;

  if (lastTwo >= 11 && lastTwo <= 14) {
    return `${count} записей активности`;
  }

  if (last === 1) {
    return `${count} запись активности`;
  }

  if (last >= 2 && last <= 4) {
    return `${count} записи активности`;
  }

  return `${count} записей активности`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatTime(value) {
  return new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(new Date(value));
}

function humanizeError(error, fallback) {
  if (!error) {
    return fallback;
  }

  if (isMissingProfileCountryCodeError(error)) {
    return "Схема профилей в Supabase устарела. Повторно выполните supabase-schema.sql, чтобы добавить столбец country_code.";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error.message) {
    return error.message;
  }

  return fallback;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
