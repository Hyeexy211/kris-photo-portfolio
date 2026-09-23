const dashboardStatus = document.querySelector("#dashboard-status");
const dashboardAuth = document.querySelector("#dashboard-auth");
const dashboardLoginForm = document.querySelector("#dashboard-login-form");
const dashboardLinks = document.querySelector("#dashboard-links");
const dashboardI18n = window.siteI18n;
let dashboardAccessGeneration = 0;
let dashboardStatusState = null;

function renderDashboardStatus() {
    if (!dashboardStatusState) return;
    dashboardStatus.textContent = dashboardI18n.t(dashboardStatusState.key, dashboardStatusState.values);
}

function showDashboardAccess(allowed, key, values = {}) {
    dashboardAuth.hidden = allowed;
    dashboardLinks.hidden = !allowed;
    dashboardStatusState = { key, values };
    renderDashboardStatus();
}

async function checkDashboardAccess() {
    const generation = ++dashboardAccessGeneration;
    showDashboardAccess(false, "dashboard.status.checking");

    try {
        const client = await getSupabaseClient();
        const { data: userData } = await client.auth.getUser();
        if (generation !== dashboardAccessGeneration) return;

        if (!userData?.user) {
            showDashboardAccess(false, "dashboard.status.signInRequired");
            return;
        }

        const { data: allowed, error } = await client.rpc("is_portfolio_admin");
        if (generation !== dashboardAccessGeneration) return;
        if (error) throw error;
        showDashboardAccess(
            allowed === true,
            allowed === true ? "dashboard.status.confirmed" : "admin.auth.notOwner"
        );
    } catch (error) {
        if (generation !== dashboardAccessGeneration) return;
        showDashboardAccess(false, "dashboard.status.unavailable", { message: error.message });
    }
}

dashboardLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    try {
        const client = await getSupabaseClient();
        const { error } = await client.auth.signInWithPassword({
            email: dashboardLoginForm.elements.email.value,
            password: dashboardLoginForm.elements.password.value
        });
        dashboardLoginForm.elements.password.value = "";
        if (error) throw error;
        await checkDashboardAccess();
    } catch (error) {
        dashboardLoginForm.elements.password.value = "";
        showDashboardAccess(false, "admin.auth.signInFailed", { message: error.message });
    }
});

getSupabaseClient().then((client) => {
    client.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT") {
            dashboardAccessGeneration++;
            showDashboardAccess(false, "dashboard.status.signedOut");
        }
    });
    checkDashboardAccess();
}).catch((error) => showDashboardAccess(false, "dashboard.status.unavailable", { message: error.message }));

dashboardI18n.onChange(() => {
    document.title = dashboardI18n.t("dashboard.seo.title");
    renderDashboardStatus();
});
document.title = dashboardI18n.t("dashboard.seo.title");
