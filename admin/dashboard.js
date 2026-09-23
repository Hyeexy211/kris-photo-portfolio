const dashboardStatus = document.querySelector("#dashboard-status");
const dashboardAuth = document.querySelector("#dashboard-auth");
const dashboardLoginForm = document.querySelector("#dashboard-login-form");
const dashboardLinks = document.querySelector("#dashboard-links");
let dashboardAccessGeneration = 0;

function showDashboardAccess(allowed, message) {
    dashboardAuth.hidden = allowed;
    dashboardLinks.hidden = !allowed;
    dashboardStatus.textContent = message;
}

async function checkDashboardAccess() {
    const generation = ++dashboardAccessGeneration;
    showDashboardAccess(false, "Checking owner access…");

    try {
        const client = await getSupabaseClient();
        const { data: userData } = await client.auth.getUser();
        if (generation !== dashboardAccessGeneration) return;

        if (!userData?.user) {
            showDashboardAccess(false, "Sign in with the enrolled owner account to open the Dashboard.");
            return;
        }

        const { data: allowed, error } = await client.rpc("is_portfolio_admin");
        if (generation !== dashboardAccessGeneration) return;
        if (error) throw error;
        showDashboardAccess(
            allowed === true,
            allowed === true ? "Owner access confirmed." : "This account is not enrolled as a portfolio admin."
        );
    } catch (error) {
        if (generation !== dashboardAccessGeneration) return;
        showDashboardAccess(false, `Dashboard unavailable: ${error.message}`);
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
        showDashboardAccess(false, `Sign in failed: ${error.message}`);
    }
});

getSupabaseClient().then((client) => {
    client.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_OUT") {
            dashboardAccessGeneration++;
            showDashboardAccess(false, "Sign in to open the Dashboard.");
        }
    });
    checkDashboardAccess();
}).catch((error) => showDashboardAccess(false, `Dashboard unavailable: ${error.message}`));
