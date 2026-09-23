// Save a read-only copy of the public Supabase content tables outside this repo.
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const destination = process.argv[2] && path.resolve(process.argv[2]);

if (!destination || process.argv.length !== 3) {
    throw new Error("Usage: node scripts/export-public-content.js /path/to/external-backup-directory");
}
if (destination === root || destination.startsWith(`${root}${path.sep}`)) {
    throw new Error("Choose a backup directory outside this website repository.");
}
if (!fs.existsSync(destination) || !fs.statSync(destination).isDirectory()) {
    throw new Error("Backup destination must be an existing directory.");
}

const configSource = fs.readFileSync(path.join(root, "js/config/data-source.js"), "utf8");
const config = vm.runInNewContext(`${configSource}\nCONTENT_DATA_SOURCE`, {}, { timeout: 1000 });
const { url, publishableKey } = config.supabase;
if (!url.startsWith("https://") || !publishableKey.startsWith("sb_publishable_")) {
    throw new Error("A public Supabase URL and publishable key are required.");
}

async function readTable(tableName) {
    const rows = [];
    const pageSize = 1000;

    for (let offset = 0; ; offset += pageSize) {
        const endpoint = new URL(`rest/v1/${tableName}`, `${url}/`);
        endpoint.searchParams.set("select", "*");
        endpoint.searchParams.set("order", "id.asc");
        endpoint.searchParams.set("limit", String(pageSize));
        endpoint.searchParams.set("offset", String(offset));
        const response = await fetch(endpoint, {
            headers: { apikey: publishableKey },
            signal: AbortSignal.timeout(15000)
        });
        if (!response.ok) throw new Error(`Could not read ${tableName}: HTTP ${response.status}`);
        const page = await response.json();
        if (!Array.isArray(page)) throw new Error(`${tableName} did not return an array.`);
        rows.push(...page);
        if (page.length < pageSize) return rows;
    }
}

async function main() {
    const [collections, photos] = await Promise.all([
        readTable("collections"),
        readTable("photos")
    ]);
    const exportedAt = new Date().toISOString();
    const backup = {
        format: "kris-public-content-v1",
        exportedAt,
        source: "Supabase public collections and photos",
        collections,
        photos
    };
    const filename = `kris-public-content-${exportedAt.replace(/[-:]/g, "").replace(/\..*$/, "Z")}.json`;
    const outputPath = path.join(destination, filename);
    fs.writeFileSync(outputPath, `${JSON.stringify(backup, null, 2)}\n`, { flag: "wx", mode: 0o600 });
    console.log(`Saved ${collections.length} Collections and ${photos.length} Photos to ${outputPath}`);
}

main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});
