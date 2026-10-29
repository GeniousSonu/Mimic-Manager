#!/usr/bin/env ts-node
import { RenderClient } from '../render/render-client';

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const command = args[0];

  if (!command || command === '--help' || command === '-h') {
    console.log(`
Mimic Manager Render API CLI
Usage:
  ts-node scripts/deploy/render-api.ts <command> [options]

Commands:
  whoami                      List workspaces/owners
  list-services               List all web services and background workers
  get-service <id>            Get details of a specific service
  list-env <serviceId>        List environment variable keys
  trigger-deploy <serviceId>  Trigger a manual deployment
  status <serviceId>          Show latest deploy status

Options:
  --dry-run                   Simulate mutations without calling Render API
    `);
    process.exit(0);
  }

  const client = new RenderClient({ dryRun: isDryRun });

  try {
    switch (command) {
      case 'whoami': {
        const owners = await client.getOwners();
        console.log('[+] Render Workspaces / Owners:');
        console.table(
          owners.map((o) => ({
            ID: o.id,
            Name: o.name,
            Email: o.email,
            Type: o.type,
          })),
        );
        break;
      }

      case 'list-services': {
        const services = await client.listServices();
        console.log(`[+] Total Services: ${services.length}`);
        console.table(
          services.map((s) => ({
            ID: s.id,
            Name: s.name,
            Type: s.type,
            Region: s.serviceDetails?.region,
            Plan: s.serviceDetails?.plan,
            URL: s.serviceDetails?.url,
          })),
        );
        break;
      }

      case 'get-service': {
        const serviceId = args[1];
        if (!serviceId) throw new Error('Missing service ID');
        const s = await client.getService(serviceId);
        console.log(JSON.stringify(s, null, 2));
        break;
      }

      case 'list-env': {
        const serviceId = args[1];
        if (!serviceId) throw new Error('Missing service ID');
        const vars = await client.getEnvVars(serviceId);
        console.log(`[+] Environment Variables for service ${serviceId}:`);
        console.table(vars.map((v) => ({ Key: v.key, Value: '[REDACTED]' })));
        break;
      }

      case 'trigger-deploy': {
        const serviceId = args[1];
        if (!serviceId) throw new Error('Missing service ID');
        console.log(`[*] Triggering deploy for ${serviceId}...`);
        const deploy = await client.triggerDeploy(serviceId);
        console.log(`[+] Deploy triggered successfully: ID=${deploy.id}, Status=${deploy.status}`);
        break;
      }

      case 'status': {
        const serviceId = args[1];
        if (!serviceId) throw new Error('Missing service ID');
        const deploys = await client.listDeploys(serviceId, 5);
        console.log(`[+] Recent deployments for ${serviceId}:`);
        console.table(
          deploys.map((d) => ({
            ID: d.id,
            Status: d.status,
            Trigger: d.trigger,
            Created: d.createdAt,
            Finished: d.finishedAt || 'in progress',
          })),
        );
        break;
      }

      default:
        console.error(`[-] Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[-] Error: ${message}`);
    process.exit(1);
  }
}

main();
